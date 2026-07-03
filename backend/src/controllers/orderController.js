const prisma = require('../config/prisma');
const logger = require('../config/logger');

// ============================================================================
// 1. POST /api/orders (Create Order + Snapshot Prices Server-Side)
// ============================================================================
async function createOrder(req, res) {
  try {
    const { customerId, addressId, items } = req.body;

    // Business Rule 1: Reject orders with 0 items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    const cId = parseInt(customerId, 10);
    const aId = parseInt(addressId, 10);

    // Verify Customer and Address exist (and address belongs to this customer!)
    const customer = await prisma.customer.findUnique({ where: { id: cId } });
    const address = await prisma.address.findFirst({ where: { id: aId, customerId: cId } });

    if (!customer || !address) {
      return res.status(404).json({ error: 'Customer or specified Address not found.' });
    }

    // Extract distinct requested menu item IDs
    const requestedItemIds = items.map(i => parseInt(i.menuItemId, 10));

    // Fetch live prices directly from DB (NEVER TRUST CLIENT PRICES)
    const dbMenuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: requestedItemIds },
        isAvailable: true // Item must be actively available
      }
    });

    // If DB returned fewer items than requested, someone ordered an unavailable/fake item
    if (dbMenuItems.length !== new Set(requestedItemIds).size) {
      return res.status(400).json({ error: 'One or more requested menu items are unavailable or do not exist.' });
    }

    let calculatedTotal = 0;

    // Build the snapshot payload
    const orderItemsPayload = items.map(clientItem => {
      const dbItem = dbMenuItems.find(m => m.id === parseInt(clientItem.menuItemId, 10));
      const quantity = parseInt(clientItem.quantity, 10);

      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('INVALID_QUANTITY');
      }

      const unitPrice = dbItem.price; // Captured strictly at this exact millisecond
      const subtotal = unitPrice * quantity;
      
      calculatedTotal += subtotal;

      return {
        menuItemId: dbItem.id,
        quantity: quantity,
        unitPrice: unitPrice,
        subtotal: subtotal
      };
    });

    // Atomic Creation of Order and OrderItems
    const newOrder = await prisma.order.create({
      data: {
        customerId: cId,
        addressId: aId,
        totalAmount: calculatedTotal,
        status: 'RECEIVED', 
        items: {
          create: orderItemsPayload
        }
      },
      include: {
        items: true,
        customer: { select: { name: true, phoneNumber: true } },
        address: true
      }
    });

    return res.status(201).json(newOrder);
  } catch (error) {
    if (error.message === 'INVALID_QUANTITY') {
      return res.status(400).json({ error: 'Item quantities must be positive integers.' });
    }
    logger.error(error, 'Error creating order:');
    return res.status(500).json({ error: 'Internal server error while creating order.' });
  }
}

// ============================================================================
// 2. GET /api/orders (Paginated List with Status & Date Filtering)
// ============================================================================
async function getOrders(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { status, date } = req.query;

    const skip = (page - 1) * limit;
    const whereClause = {};

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      whereClause.createdAt = { gte: startOfDay, lte: endOfDay };
    }

    const [orders, totalCount] = await prisma.$transaction([
      prisma.order.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, phoneNumber: true } }
        }
      }),
      prisma.order.count({ where: whereClause })
    ]);

    return res.status(200).json({
      data: orders,
      meta: {
        totalItems: totalCount,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    logger.error(error, 'Error fetching order list:');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ============================================================================
// 3. GET /api/orders/:id (Full Order Detail)
// ============================================================================
async function getOrderById(req, res) {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order ID.' });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        address: true,
        items: {
          include: { menuItem: { select: { name: true } } }
        }
      }
    });

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    return res.status(200).json(order);
  } catch (error) {
    logger.error(error, 'Error fetching order details:');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ============================================================================
// 4. PATCH /api/orders/:id/status (State Machine Transition Validator)
// ============================================================================
async function updateOrderStatus(req, res) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isNaN(orderId) || !status) {
      return res.status(400).json({ error: 'Order ID and target status are required.' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const currentStatus = order.status;
    const targetStatus = status.toUpperCase();

    const ALLOWED_TRANSITIONS = {
      RECEIVED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['DELIVERING', 'CANCELLED'],
      DELIVERING: ['COMPLETED'],
      COMPLETED: [], 
      CANCELLED: []  
    };

    const validNextStates = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!validNextStates.includes(targetStatus)) {
      return res.status(400).json({
        error: `Invalid status transition. Cannot change order from '${currentStatus}' to '${targetStatus}'. Allowed transitions from current state: [${validNextStates.join(', ')}]`
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: targetStatus }
    });

    logger.info(`Order #${orderId} transitioned: ${currentStatus} -> ${targetStatus}`);
    return res.status(200).json(updatedOrder);
  } catch (error) {
    logger.error(error, 'Error updating order status:');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ============================================================================
// 5. GET /api/orders/stats (Dashboard Analytics & Metrics)
// ============================================================================
async function getDashboardStats(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrderCount, pendingOrderCount, revenueAggregated] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: { gte: today }
        }
      }),

      prisma.order.count({ where: { status: 'RECEIVED' } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: 'CANCELLED' } }
      })
    ]);

    const totalRevenue = (revenueAggregated && revenueAggregated._sum && revenueAggregated._sum.totalAmount) 
      ? Number(revenueAggregated._sum.totalAmount) 
      : 0;

    res.status(200).json({
      todayOrderCount,
      pendingOrderCount,
      totalRevenue
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getDashboardStats 
};
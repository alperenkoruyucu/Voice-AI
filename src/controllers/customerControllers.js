const prisma = require('../config/prisma');
const logger = require('../config/logger');

// ============================================================================
// 1. GET /api/customers?phone=+90... (Fast lookup via Unique B-Tree Index)
// ============================================================================
async function getCustomerByPhone(req, res) {
  try {
    const { phone } = req.query;

    // Standard REST: If no query param is passed, return the whole list
    if (!phone) {
      const allCustomers = await prisma.customer.findMany({
        include: { addresses: true },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(allCustomers);
    }

    // URL ENCODING TRAP FIX: 
    // Browsers/Postman often convert the "+" sign in "?phone=+90555" into a space " 90555". 
    // We safely restore the "+" sign if it got corrupted.
    const sanitizedPhone = phone.trim().replace(/^ /, '+');

    const customer = await prisma.customer.findUnique({
      where: { phoneNumber: sanitizedPhone },
      include: {
        addresses: {
          orderBy: { isDefault: 'desc' } // Default address arrives at array[0]
        }
      }
    });

    // Acceptance Criteria: Unknown phone must return 404, strictly NOT 500
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found with the provided phone number.' });
    }

    return res.status(200).json(customer);
  } catch (error) {
    logger.error(error, 'Error in getCustomerByPhone:');
    return res.status(500).json({ error: 'Internal server error while searching customer.' });
  }
}

// ============================================================================
// 2. POST /api/customers (Creates customer + default address atomically)
// ============================================================================
async function createCustomer(req, res, next) {
  try {
    const { phoneNumber, name, email, street, city } = req.body;

    const newCustomer = await prisma.customer.create({
      data: {
        phoneNumber,
        name,
        email,
        addresses: {
          create: [
            {
              street,
              city: city || 'Istanbul',
              isDefault: true
            }
          ]
        }
      },
      include: { addresses: true }
    });

    return res.status(201).json(newCustomer);
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// 3. GET /api/customers/:id (Calculates order_count and last_order_date)
// ============================================================================
async function getCustomerById(req, res) {
  try {
    const customerId = parseInt(req.params.id, 10);

    if (isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer ID format. Must be an integer.' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        _count: {
          select: { orders: true } // Let Postgres count orders magically
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Grab only the single most recent order snapshot
          select: { createdAt: true }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Shape the payload strictly adhering to the requested goal specs
    const payload = {
      id: customer.id,
      phoneNumber: customer.phoneNumber,
      name: customer.name,
      email: customer.email,
      createdAt: customer.createdAt,
      orderCount: customer._count.orders,
      lastOrderDate: customer.orders.length > 0 ? customer.orders[0].createdAt : null
    };

    return res.status(200).json(payload);
  } catch (error) {
    logger.error(error, 'Error in getCustomerById:');
    return res.status(500).json({ error: 'Internal server error fetching details.' });
  }
}

// ============================================================================
// 4. PUT /api/customers/:id (Updates name or email)
// ============================================================================
async function updateCustomer(req, res) {
  try {
    const customerId = parseInt(req.params.id, 10);
    const { name, email } = req.body;

    if (isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer ID format.' });
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? email : undefined
      }
    });

    return res.status(200).json(updated);
  } catch (error) {
    // P2025: Record to update not found
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Customer not found to update.' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This email is already in use by another customer.' });
    }

    logger.error(error, 'Error in updateCustomer:');
    return res.status(500).json({ error: 'Internal server error updating customer.' });
  }
}

module.exports = {
  getCustomerByPhone,
  createCustomer,
  getCustomerById,
  updateCustomer
};
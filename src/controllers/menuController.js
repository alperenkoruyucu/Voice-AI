const prisma = require('../config/prisma');
const logger = require('../config/logger');

// ============================================================================
// 1. GET /api/menu (List all categories with their nested menu items)
// ============================================================================
async function getFullMenu(req, res) {
  try {
    const menu = await prisma.menuCategory.findMany({
      include: {
        items: {
          orderBy: { id: 'asc' }
        }
      },
      orderBy: { id: 'asc' }
    });

    return res.status(200).json(menu);
  } catch (error) {
    logger.error(error, 'Error fetching full menu:');
    return res.status(500).json({ error: 'Internal server error while fetching menu.' });
  }
}

// ============================================================================
// 2. GET /api/menu/items/:id (Get single item details)
// ============================================================================
async function getMenuItemById(req, res) {
  try {
    const itemId = parseInt(req.params.id, 10);
    if (isNaN(itemId)) {
      return res.status(400).json({ error: 'Invalid item ID format.' });
    }

    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { category: true }
    });

    if (!item) {
      return res.status(404).json({ error: 'Menu item not found.' });
    }

    return res.status(200).json(item);
  } catch (error) {
    logger.error(error, 'Error fetching menu item:');
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ============================================================================
// 3. POST /api/menu/items (Create new menu item - Admin)
// ============================================================================
async function createMenuItem(req, res) {
  try {
    const { categoryId, name, price, isAvailable } = req.body;

    if (!categoryId || !name || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields: categoryId, name, price.' });
    }

    // Defensive check: Ensure the target category actually exists
    const categoryExists = await prisma.menuCategory.findUnique({
      where: { id: parseInt(categoryId, 10) }
    });

    if (!categoryExists) {
      return res.status(404).json({ error: 'Target category does not exist.' });
    }

    const newItem = await prisma.menuItem.create({
      data: {
        categoryId: parseInt(categoryId, 10),
        name,
        price: parseFloat(price),
        isAvailable: isAvailable !== undefined ? isAvailable : true
      }
    });

    return res.status(201).json(newItem);
  } catch (error) {
    logger.error(error, 'Error creating menu item:');
    return res.status(500).json({ error: 'Internal server error while creating item.' });
  }
}

// ============================================================================
// 4. PUT /api/menu/items/:id (Update item - Admin)
// ============================================================================
async function updateMenuItem(req, res) {
  try {
    const itemId = parseInt(req.params.id, 10);
    if (isNaN(itemId)) {
      return res.status(400).json({ error: 'Invalid item ID format.' });
    }

    const { categoryId, name, price, isAvailable } = req.body;

    const updatedItem = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        categoryId: categoryId !== undefined ? parseInt(categoryId, 10) : undefined,
        name: name !== undefined ? name : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        isAvailable: isAvailable !== undefined ? isAvailable : undefined
      }
    });

    return res.status(200).json(updatedItem);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Menu item not found to update.' });
    }
    logger.error(error, 'Error updating menu item:');
    return res.status(500).json({ error: 'Internal server error while updating item.' });
  }
}

// ============================================================================
// 5. DELETE /api/menu/items/:id (Smart Soft/Hard Delete Hybrid)
// ============================================================================
async function deleteMenuItem(req, res) {
  try {
    const itemId = parseInt(req.params.id, 10);
    if (isNaN(itemId)) {
      return res.status(400).json({ error: 'Invalid item ID format.' });
    }

    const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found.' });
    }

    // BUSINESS RULE CHECK: Is this item tied to any ACTIVE orders?
    const activeOrdersCount = await prisma.orderItem.count({
      where: {
        menuItemId: itemId,
        order: {
          status: {
            in: ['RECEIVED', 'PREPARING', 'DELIVERING'] // Active lifecycle states
          }
        }
      }
    });

    // Rule Triggered: Soft Delete Pattern
    if (activeOrdersCount > 0) {
      const softDeleted = await prisma.menuItem.update({
        where: { id: itemId },
        data: { isAvailable: false }
      });

      logger.warn(`Menu item ${itemId} soft-deleted due to active order constraints.`);
      
      return res.status(200).json({
        message: 'Item is currently part of an active order. Soft-deleted (is_available set to false) instead of hard deletion.',
        item: softDeleted
      });
    }

    // If no active orders exist, execute clean hard delete
    await prisma.menuItem.delete({ where: { id: itemId } });

    return res.status(204).send();
  } catch (error) {
    // P2003: Foreign Key constraint failed (Item was used in past COMPLETED orders)
    if (error.code === 'P2003') {
      const fallbackSoftDelete = await prisma.menuItem.update({
        where: { id: parseInt(req.params.id, 10) },
        data: { isAvailable: false }
      });

      return res.status(200).json({
        message: 'Item exists in historical completed orders. Soft-deleted to preserve accounting records.',
        item: fallbackSoftDelete
      });
    }

    logger.error(error, 'Error deleting menu item:');
    return res.status(500).json({ error: 'Internal server error while deleting item.' });
  }
}

module.exports = {
  getFullMenu,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};
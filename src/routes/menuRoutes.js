const express = require('express');
const menuController = require('../controllers/menuController');
const router = express.Router();

// 1. GET /api/menu (Categories + Items)
router.get('/', menuController.getFullMenu);

// 2. GET /api/menu/items/:id
router.get('/items/:id', menuController.getMenuItemById);

// 3. POST /api/menu/items
router.post('/items', menuController.createMenuItem);

// 4. PUT /api/menu/items/:id
router.put('/items/:id', menuController.updateMenuItem);

// 5. DELETE /api/menu/items/:id
router.delete('/items/:id', menuController.deleteMenuItem);

module.exports = router;
const express = require('express');
const customerController = require('../controllers/customerControllers');
const router = express.Router();

// 1. GET /api/customers?phone=...
router.get('/', customerController.getCustomerByPhone);

// 2. POST /api/customers
router.post('/', customerController.createCustomer);

// 3. GET /api/customers/:id
router.get('/:id', customerController.getCustomerById);

// 4. PUT /api/customers/:id
router.put('/:id', customerController.updateCustomer);

module.exports = router;
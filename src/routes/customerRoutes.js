const express = require('express');
const customerController = require('../controllers/customerControllers');
const addressRoutes = require('./addressRoutes');
const validate = require('../middlewares/validate');
const { createCustomerSchema } = require('../validators/customerValidator');
const router = express.Router();

// 1. GET /api/customers?phone=...
router.get('/', customerController.getCustomerByPhone);

// 2. POST /api/customers
router.post('/', validate(createCustomerSchema), customerController.createCustomer);

// 3. GET /api/customers/:id
router.get('/:id', customerController.getCustomerById);

// 4. PUT /api/customers/:id
router.put('/:id', customerController.updateCustomer);

// 5. Nested Address Routes for /api/customers/:id/addresses
router.use('/:id/addresses', addressRoutes);

module.exports = router;
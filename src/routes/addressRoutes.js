const express = require('express');
const addressController = require('../controllers/addressController');

// mergeParams: true allows this router to access the :id parameter from the parent router!
const router = express.Router({ mergeParams: true });

// POST /api/customers/:id/addresses
router.post('/', addressController.createAddress);

// PUT /api/customers/:id/addresses/:addressId
router.put('/:addressId', addressController.updateAddress);

// DELETE /api/customers/:id/addresses/:addressId
router.delete('/:addressId', addressController.deleteAddress);

module.exports = router;
const express = require('express');
const { createPaymentLink } = require('../controllers/paymentController');


const router = express.Router();
router.post('/create-link', createPaymentLink);

module.exports = router;
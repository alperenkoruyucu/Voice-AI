const express = require('express');
const { createPaymentLink, handlePaymentWebhook } = require('../controllers/paymentController');
const router = express.Router();

router.post('/create-link', createPaymentLink);

router.post('/webhook', handlePaymentWebhook);

module.exports = router;
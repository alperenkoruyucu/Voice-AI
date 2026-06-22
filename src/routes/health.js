const express = require('express');
const router = express.Router();
const logger = require('../config/logger');

router.get('/health', (req, res) => {
    logger.info('Health check endpoint hit');

    res.status(200).json({
        status: 'OK',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

module.exports = router;
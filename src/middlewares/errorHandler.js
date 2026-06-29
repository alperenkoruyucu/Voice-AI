const logger = require('../config/logger');
const { ZodError } = require('zod');

function errorHandler(err, req, res, next) {
    if (err instanceof ZodError) {
        const formattedErrors = err.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
        }));
        return res.status(400).json({
            error: 'Input Validation failed',
            details: formattedErrors
        });
    }

    if (err.code === 'P2002') {
        return res.status(400).json({ error: 'A record with this unique attribute already exists'})
    }

    if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Requested resource not found in database.' })
    }

    logger.error(err, '❌ Unhandled Exception:');
    return res.status(500).json({ error: 'Internal server error', ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) });
}

module.exports = errorHandler;
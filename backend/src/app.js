const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const logger = require('./config/logger');
require('./config/prisma');
const healthRouter = require('./routes/health');
const customerRoutes = require('./routes/customerRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const errorHandler = require('./middlewares/errorHandler');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', healthRouter);
app.use('/api/customers', customerRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

app.use(errorHandler);

const server = app.listen(PORT);

server.on('listening', () => {
    logger.info(`Server is running on port ${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} zaten kullanımda. Mevcut process'i durdurup tekrar deneyin.`);
    } else {
        logger.error({ err }, '❌ Server başlatılamadı.');
    }
    process.exit(1);
});


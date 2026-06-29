const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const logger = require('./config/logger');
require('./config/prisma');
const healthRouter = require('./routes/health');
const customerRoutes = require('./routes/customerRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', healthRouter);
app.use('/api/customers', customerRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});


const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const logger = require('./config/logger');
require('./config/prisma');
const healthRouter = require('./routes/health');
const customerRouter = require('./routes/customerRoutes');



const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', healthRouter);
app.use('/api/customers', customerRouter);

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});


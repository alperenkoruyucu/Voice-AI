const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const logger = require('./config/logger');
require('./config/prisma');
const healthRouter = require('./routes/health');



const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', healthRouter);

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});


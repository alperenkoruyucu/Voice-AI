const express = require('express');
const dotenv = require('dotenv');
const logger = require('./config/logger');
const healthRouter = require('./routes/health');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', healthRouter);

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});


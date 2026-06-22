require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const logger = require('./logger');

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter });

async function connectDB() {
  try {
    await prisma.$connect();
    logger.info('PostgreSQL Veritabanına Prisma ORM ile başarıyla bağlanıldı.');
  } catch (error) {
    logger.error('Veritabanı bağlantı hatası:', error);
    process.exit(1);
  }
}

connectDB();

module.exports = prisma;
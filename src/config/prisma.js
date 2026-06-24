require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

// 1. Create the official Node.js Postgres connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Bind the pool to Prisma's v7 adapter
const adapter = new PrismaPg(pool);

// 3. Instantiate PrismaClient with this modern adapter
const prisma = new PrismaClient({ adapter });

async function connectDB() {
  try {
    await prisma.$connect();
    logger.info('📦 PostgreSQL Veritabanına Prisma v7 (Pg-Adapter) ile başarıyla bağlanıldı.');
  } catch (error) {
    logger.error('❌ Veritabanı bağlantı hatası:', error);
    process.exit(1);
  }
}

connectDB();

module.exports = prisma;
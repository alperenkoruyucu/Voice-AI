const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

// 1. Node.js'in resmi Postgres havuzunu oluşturuyoruz
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Havuzu Prisma'nın anlayacağı v7 adaptörüne bağlıyoruz
const adapter = new PrismaPg(pool);

// 3. PrismaClient'ı bu modern adaptörle fırlatıyoruz!
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
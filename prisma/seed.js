const prisma = require('../src/config/prisma');
const logger = require('../src/config/logger');

async function main() {
  logger.info('🌱 Seeding operation has started...');

  // =====================================================================
  // 1. DATABASE CLEANUP (Idempotency - Reverse cascade deletion order)
  // =====================================================================
  logger.info('🧹 Cleaning up old database records...');

  await prisma.paymentTransaction.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.call.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();

  logger.info('✔ Database purged successfully.');

  // =====================================================================
  // 2. CREATE MENU CATEGORIES
  // =====================================================================
  logger.info('🍽️ Populating menu categories...');

const mainCourseCat = await prisma.menuCategory.create({
  data: { 
    name: 'Ana Yemek', 
    description: 'Odun ateşinde, fırında ve ızgarada pişen lezzetler' 
  }
});

const beverageCat = await prisma.menuCategory.create({
  data: { 
    name: 'İçecek', 
    description: 'Buz gibi ferahlatıcı içecekler' 
  }
});

const dessertCat = await prisma.menuCategory.create({
  data: { 
    name: 'Tatlı', 
    description: 'Geleneksel ve modern tatlı alternatifleri' 
  }
});

// =====================================================================
// 3. CREATE MENU ITEMS (Keys are English, Values are Turkish)
// =====================================================================
logger.info('🍕 Inserting 12 delicious menu items...');

await prisma.menuItem.createMany({
  data: [
    // Main Courses
    { categoryId: mainCourseCat.id, name: 'Margarita Pizza (İnce Hamur)', price: 240.0, isAvailable: true },
    { categoryId: mainCourseCat.id, name: 'Arca Özel Trüflü Burger', price: 280.0, isAvailable: true },
    { categoryId: mainCourseCat.id, name: 'Kasap Sucuklu Ev Yapımı Pizza', price: 270.0, isAvailable: true },
    { categoryId: mainCourseCat.id, name: 'Antep Usulü Çıtır Lahmacun', price: 90.0, isAvailable: true },
    { categoryId: mainCourseCat.id, name: 'Zırh Kıyma Adana Dürüm', price: 210.0, isAvailable: true },
    { categoryId: mainCourseCat.id, name: 'Fesleğenli Ev Yapımı Erişte', price: 180.0, isAvailable: false },

    // Beverages
    { categoryId: beverageCat.id, name: 'Yayık Ayranı (300ml)', price: 45.0, isAvailable: true },
    { categoryId: beverageCat.id, name: 'Coca-Cola Zero (330ml Kutu)', price: 50.0, isAvailable: true },
    { categoryId: beverageCat.id, name: 'Acılı Şalgam Suyu (330ml)', price: 45.0, isAvailable: true },

    // Desserts
    { categoryId: dessertCat.id, name: 'Hatay Usulü Peynirli Künefe', price: 160.0, isAvailable: true },
    { categoryId: dessertCat.id, name: 'Bol Fındıklı Fırın Sütlaç', price: 110.0, isAvailable: true },
    { categoryId: dessertCat.id, name: 'İtalyan Tiramisu', price: 150.0, isAvailable: true },
  ]
});

  // =====================================================================
  // 4. CREATE VIP TEST CUSTOMERS & ADDRESSES (Partial Index testing)
  // =====================================================================
  logger.info('👤 Registering 3 VIP test customers...');

  // Customer 1 (Has 2 addresses: 1 default, 1 regular)
  await prisma.customer.create({
    data: {
      phoneNumber: '+905551112233',
      name: 'Alperen Koruyucu',
      addresses: {
        create: [
          { street: 'Bostanci Mah. Sahil Yolu Cad. No:12 D:4', city: 'Istanbul', isDefault: true },
          { street: 'Caferaga Mah. Moda Cad. No:45', city: 'Istanbul', isDefault: false }
        ]
      }
    }
  });

  // Customer 2
  await prisma.customer.create({
    data: {
      phoneNumber: '+905317589938',
      name: 'İsmail Kartal',
      addresses: {
        create: [
          { street: 'Maslak Mah. Buyukdere Cad. No:190 Plaza Kat:14', city: 'Istanbul', isDefault: true }
        ]
      }
    }
  });

  // Customer 3
  await prisma.customer.create({
    data: {
      phoneNumber: '+905307508844',
      name: 'Lewis Hamilton',
      addresses: {
        create: [
          { street: 'Maltepe Sahil Yolu, Balikci Barinagi Karsisi', city: 'Istanbul', isDefault: true }
        ]
      }
    }
  });

  logger.info('✔ SEEDING SUCCESSFUL! Database is ready for demo.');
}

main()
  .catch((error) => {
    logger.error(error, '❌ An error occurred while seeding the database:');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
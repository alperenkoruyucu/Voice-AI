const prisma = require('../config/prisma');
const logger = require('../config/logger');

// ============================================================================
// 1. GET /api/customers?phone=+90... (Fast lookup via Unique B-Tree Index)
// ============================================================================
async function getCustomerByPhone(req, res) {
  try {
    const { phone, search } = req.query;

    // SENARYO A: Arama kutusundan (Frontend) ?search= ile kelime gelirse
    if (search) {
      const customers = await prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phoneNumber: { contains: search } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(customers);
    }

    // SENARYO B: Eski sistem ?phone= gelirse (Senin yazdığın URL Encoding Koruması)
    if (phone) {
      const sanitizedPhone = phone.trim().replace(/^ /, '+');
      const customer = await prisma.customer.findUnique({
        where: { phoneNumber: sanitizedPhone },
        include: {
          addresses: { orderBy: { isDefault: 'desc' } }
        }
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found with the provided phone number.' });
      }
      return res.status(200).json(customer); // Frontend tek obje dönmesini bekliyor
    }

    // SENARYO C: Hiçbir şey gelmezse tüm listeyi dön
    const allCustomers = await prisma.customer.findMany({
      include: { addresses: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(allCustomers);
    
  } catch (error) {
    logger.error(error, 'Error in getCustomers:');
    return res.status(500).json({ error: 'Internal server error while searching customer.' });
  }
}

// ============================================================================
// 2. POST /api/customers (Creates customer + default address atomically)
// ============================================================================
async function createCustomer(req, res, next) {
  try {
    const { phoneNumber, name, email, street, city } = req.body;

    const newCustomer = await prisma.customer.create({
      data: {
        phoneNumber,
        name,
        email,
        addresses: {
          create: [
            {
              street,
              city: city || 'Istanbul',
              isDefault: true
            }
          ]
        }
      },
      include: { addresses: true }
    });

    return res.status(201).json(newCustomer);
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// 3. GET /api/customers/:id (Calculates order_count and last_order_date)
// ============================================================================
async function getCustomerById(req, res) {
  try {
    const customerId = parseInt(req.params.id, 10);

    if (isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer ID format. Must be an integer.' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      // FRONTEND İÇİN GÜNCELLEME: Sadece orderCount değil, tüm sipariş ve adres verisini dahil ediyoruz.
      include: {
        addresses: {
          orderBy: { isDefault: 'desc' }
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: { 
            items: {
              include: { menuItem: { select: { name: true } } } // İŞTE BU SATIR EKLENDİ!
            } 
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Tüm nesneyi olduğu gibi dönüyoruz ki Frontend Modal'ı içindeki dizileri (array) kullanabilsin.
    return res.status(200).json(customer);
  } catch (error) {
    logger.error(error, 'Error in getCustomerById:');
    return res.status(500).json({ error: 'Internal server error fetching details.' });
  }
}

// ============================================================================
// 4. PUT /api/customers/:id (Updates name or email)
// ============================================================================
async function updateCustomer(req, res) {
  try {
    const customerId = parseInt(req.params.id, 10);
    const { name, email } = req.body;

    if (isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer ID format.' });
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? email : undefined
      }
    });

    return res.status(200).json(updated);
  } catch (error) {
    // P2025: Record to update not found
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Customer not found to update.' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This email is already in use by another customer.' });
    }

    logger.error(error, 'Error in updateCustomer:');
    return res.status(500).json({ error: 'Internal server error updating customer.' });
  }
}

module.exports = {
  getCustomerByPhone,
  createCustomer,
  getCustomerById,
  updateCustomer
};
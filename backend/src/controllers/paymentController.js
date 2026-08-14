const prisma = require('../config/prisma');
const Iyzipay = require('iyzipay');

// iyzico Ayarlarını Yükle
const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY,
  secretKey: process.env.IYZICO_SECRET_KEY,
  uri: process.env.IYZICO_URI
});

const createPaymentLink = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId, 10) },
      include: { 
        items: { include: { menuItem: true } },
        customer: true, // iyzico müşteri bilgisini zorunlu ister
        address: true   // iyzico adres bilgisini zorunlu ister
      }
    });

    if (!order) return res.status(404).json({ error: "Sipariş bulunamadı." });

    // iyzico Sepet Ürünlerini Hazırlama
    const basketItems = order.items.map(item => ({
        id: item.menuItemId.toString(),
        name: item.menuItem.name,
        category1: 'Yemek',
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: item.subtotal.toString() 
      }));

    // iyzico İstek Paketi (Payload)
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: `ORDER-${order.id}`,
      price: order.totalAmount.toString(),
      paidPrice: order.totalAmount.toString(),
      currency: Iyzipay.CURRENCY.TRY,
      basketId: order.id.toString(),
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: 'http://localhost:3000/api/payments/webhook', // Ödeme bitince gidilecek yer
      enabledInstallments: [1], // Tek çekim
      buyer: {
        id: order.customer.id.toString(),
        name: order.customer.name?.split(' ')[0] || 'Misafir',
        surname: order.customer.name?.split(' ')[1] || 'Müşteri',
        gsmNumber: order.customer.phoneNumber,
        email: order.customer.email || 'test@test.com', // Opsiyonel ama önerilir
        identityNumber: '11111111111', // Test için dummy TC
        registrationAddress: order.address.street,
        ip: req.ip || '85.34.78.112',
        city: order.address.city,
        country: 'Turkey',
      },
      shippingAddress: {
        contactName: order.customer.name || 'Misafir Müşteri',
        city: order.address.city,
        country: 'Turkey',
        address: order.address.street,
      },
      billingAddress: {
        contactName: order.customer.name || 'Misafir Müşteri',
        city: order.address.city,
        country: 'Turkey',
        address: order.address.street,
      },
      basketItems: basketItems
    };

    // iyzico'ya İsteği Gönder (Callback yapısı kullanır)
    iyzipay.checkoutFormInitialize.create(request, async function (err, result) {
      if (err || result.status === 'failure') {
        console.error("iyzico Hatası:", result?.errorMessage || err);
        return res.status(500).json({ error: "Ödeme sayfası oluşturulamadı.", details: result?.errorMessage });
      }

      // Başarılıysa veritabanını güncelle
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentUrl: result.paymentPageUrl,
          paymentExpiresAt: expiresAt,
          payments: {
            create: {
              provider: 'IYZICO',
              transactionId: result.token, // iyzico'nun verdiği takip token'ı
              status: 'PENDING'
            }
          }
        }
      });

      return res.status(200).json({ 
        paymentUrl: result.paymentPageUrl, 
        token: result.token 
      });
    });

  } catch (error) {
    console.error("Ödeme linki hatası:", error);
    return res.status(500).json({ error: "Sunucu hatası." });
  }
};

const handlePaymentWebhook = async (req, res) => {
  try {
    const token = req.body?.token;

    if (!token) {
      return res.status(400).json({ error: "Token eksik." });
    }

    
    const transaction = await prisma.paymentTransaction.findFirst({
      where: { transactionId: token },
      include: { order: true }
    });

    if (!transaction) {
      return res.status(404).json({ error: "İşlem kaydı bulunamadı." });
    }

    
    if (transaction.status !== 'PENDING') {
      const isSuccess = transaction.status === 'SUCCESS';
      return res.redirect(`http://localhost:5173/payment/result?status=${isSuccess ? 'success' : 'failed'}`);
    }

    iyzipay.checkoutForm.retrieve({
      locale: 'tr',
      token: token
    }, async (err, result) => {
      
    
      if (err || result.status === 'failure' || result.paymentStatus !== 'SUCCESS') {
        
        await prisma.order.update({
          where: { id: transaction.orderId },
          data: { paymentStatus: 'FAILED' }
        });
        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: { status: 'FAILED' }
        });

        return res.redirect('http://localhost:5173/payment/result?status=failed');
      }


      if (result.paymentStatus === 'SUCCESS') {
        
        await prisma.order.update({
          where: { id: transaction.orderId },
          data: { 
            paymentStatus: 'PAID',
            status: 'PREPARING' 
          }
        });

        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: { status: 'SUCCESS' }
        });

        return res.redirect('http://localhost:5173/payment/result?status=success');
      }
    });

  } catch (error) {
    console.error("Webhook işleme hatası:", error);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
};


module.exports = { createPaymentLink, handlePaymentWebhook };

# Voice AI & Restaurant Automation Backend

Bu proje, Node.js (Express) ve PostgreSQL kullanılarak geliştirilen bir sesli yapay zeka sipariş ve restoran otomasyonu backend servisidir.

## 🚀 Teknolojiler
- **Runtime:** Node.js LTS
- **Framework:** Express.js
- **Veritabanı:** PostgreSQL
- **ORM:** Prisma v7 (Pg-Adapter)
- **Logger:** Pino & Pino-Pretty

## 📦 Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükleyin
```bash
npm install
```

### 2. Çevre Değişkenlerini Ayarlayın
`cp .env.example .env` komutuyla `.env` dosyanızı oluşturun ve içerisindeki `DATABASE_URL` parametresini kendi yerel PostgreSQL bilgilerinize göre doldurun:
```env
DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/voice_ai_dev?schema=public"
```

### 3. Veritabanını Hazırlayın (Migrations)
Veritabanı tablolarını ve ilişkilerini yerel PostgreSQL motorunuza inşa etmek için:
```bash
npx prisma migrate dev
```
Prisma v7 Javascript tercüman motorunu (Client) kodla eşitlemek için:
```bash
npx prisma generate
```

### 4. Sunucuyu Başlatın
```bash
# Geliştirme modu (Nodemon ile - Otomatik yenileme)
npm run dev

# Normal mod
npm start
```

## 🗄️ Veritabanı Şeması (8 Temel Tablo)
Sistem aşağıdaki ilişkisel tablolardan oluşmaktadır:

1. **`customers`**: Telefon numarası tekil (`@unique`) olan ana müşteri tablosu.
2. **`addresses`**: Müşteri adresleri *(Özel kural: Bir müşterinin sadece bir adet is_default=true adresi olabilir).*
3. **`menu_categories`**: Menü kategorileri.
4. **`menu_items`**: Menü ürünleri ve anlık stok/uygunluk durumları.
5. **`orders`**: Siparişler, sipariş durumları (`OrderStatus`) ve ödeme durumları (`PaymentStatus`).
6. **`order_items`**: Fiyat değişimi paradoksunu önlemek adına, siparişin verildiği anki birim fiyatı (**Snapshot**) tutan kalemler.
7. **`calls`**: Yapay zeka ile yapılan telefon görüşmelerinin transkriptleri, süreleri ve durumları.
8. **`payment_transactions`**: Ödeme sağlayıcılarının işlem dökümleri.


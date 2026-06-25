# Voice AI & Restaurant Automation Backend

A robust, production-ready backend service for voice-AI-driven food ordering and restaurant automation, built with Node.js (Express) and PostgreSQL.

## 🚀 Technologies
- **Runtime:** Node.js LTS
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma v7 (Pg-Adapter)
- **Logger:** Pino & Pino-Pretty

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the example environment file and update the `DATABASE_URL` with your local PostgreSQL credentials:
```bash
cp .env.example .env
```

### 3. Run Database Migrations
Apply the relational schema to your local PostgreSQL instance:
```bash
npx prisma migrate dev
```
Generate the Prisma Client (v7 JS Engine) to match the database schema:
```bash
npx prisma generate
```

### 4. Seed the Database
Populate the database with initial menu categories, 12 sample menu items, and 3 VIP test customers for local development:
```bash
npm run seed
```

### 5. Start the Server
```bash
# Development mode (with nodemon auto-reload)
npm run dev

# Production mode
npm start
```

## 🔌 API Reference

### Customers API
* **`GET /api/customers?phone={number}`** : Fast lookup of a customer by phone number (returns 404 if not found).
* **`POST /api/customers`** : Registers a new customer and their default delivery address atomically.
* **`GET /api/customers/:id`** : Retrieves customer details, total order count, and last order date.
* **`PUT /api/customers/:id`** : Updates a customer's basic information (name/email).

## 🗄️ Database Schema (8 Core Tables)
The system relies on the following fully normalized relational entities:

1. **`customers`**: Core customer profiles indexed by a unique `phone_number`.
2. **`addresses`**: Customer delivery locations *(Enforced partial unique index: strictly one `is_default=true` per customer)*.
3. **`menu_categories`**: Product classifications (e.g., Main Courses, Beverages).
4. **`menu_items`**: Menu catalog holding active price points and real-time `is_available` flags.
5. **`orders`**: Order envelopes tracking lifecycle (`OrderStatus`) and financial state (`PaymentStatus`).
6. **`order_items`**: Order line items capturing a strict historical **price snapshot** (`unit_price`) at the exact moment of checkout.
7. **`calls`**: Audio call logs containing raw AI transcripts, call durations, and status enums.
8. **`payment_transactions`**: Financial audit logs for third-party payment gateways.

---
*Built strictly adhering to Git-Flow principles and layered domain architecture.*
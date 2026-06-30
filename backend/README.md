# Voice AI & Restaurant Automation Backend

A robust, production-ready backend service for voice-AI-driven food ordering and restaurant automation, built with Node.js (Express) and PostgreSQL.

## 🚀 Technologies
- **Runtime:** Node.js LTS
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma v7 (Pg-Adapter)
- **Validation:** Zod v4 *(Fail-Fast Pipeline)*
- **Logger:** Pino & Pino-Pretty

## 📦 Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy the example environment file and set your local credentials:
```bash
cp .env.example .env
```
Ensure your `.env` contains the required flags:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/voice_ai_dev?schema=public"
NODE_ENV="development"
```

### 3. Run Database Migrations & Generate ORM Engine
```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Seed the Database
Populate initial menu categories, 12 sample items, and 3 VIP test customers:
```bash
npm run seed
```

### 5. Start the Server
```bash
npm run dev   # Development mode with nodemon
```

## 🧪 Instant API Testing
A pre-configured Postman suite is included in this directory.
Simply import **`postman_collection.json`** into your Postman application to instantly verify all core lifecycles, transactional edge cases, and Zod trigger validations.

## 🛡️ Architecture & Safeguards
* **Strict Input Validation:** All inbound payloads pass through declarative `Zod` schemas prior to reaching controller logic.
* **Centralized Error Handling:** Uncaught exceptions and ORM constraint violations (`P2002`, `P2025`) are intercepted by a global 4-parameter Express middleware. Stack traces are strictly stripped in non-development environments to prevent reconnaissance leakage.
* **Financial Integrity:** Order line items persist immutable checkout price snapshots (`unit_price`) server-side, completely ignoring client-computed totals.
* **State Machine:** Order lifecycle progression is strictly unidirectional (`RECEIVED` -> `PREPARING` -> `DELIVERING` -> `COMPLETED`).

## 🗄️ Database Schema (8 Core Tables)
1. **`customers`** (`phone_number` unique B-Tree indexed)
2. **`addresses`** *(Enforced partial unique index: strictly one `is_default=true` per customer)*
3. **`menu_categories`**
4. **`menu_items`** *(Hybrid deletion: soft-deletes if tied to active orders)*
5. **`orders`**
6. **`order_items`** *(Historical price snapshotting)*
7. **`calls`**
8. **`payment_transactions`**

---
*Built strictly adhering to Git-Flow principles and layered domain architecture.*
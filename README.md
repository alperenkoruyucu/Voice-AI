# Voice AI & Restaurant Automation System

A production-ready monorepo containing a Node.js/PostgreSQL backend service for voice-AI-driven food ordering, and a modern React (Vite) admin dashboard.

## 🚀 Technologies
* **Backend:** Node.js, Express.js, PostgreSQL, Prisma ORM, Zod v4, Pino
* **Frontend:** React, Vite, Tailwind CSS v4, React Router
* **Payments:** İyzico Checkout Form (Sandbox & Production)
* **Architecture:** Monorepo, REST API, Layered Domain Architecture

## 📂 Project Structure
```text
VOICEAI/
├── backend/       # Core API, database models, and validation logic
└── admin-panel/   # React-based UI for restaurant management
```

## 🛠️ Getting Started

### 1. Backend Setup (API & Database)
Open your terminal and navigate to the backend directory:
```bash
cd backend
npm install
```
Configure your environment variables:
```bash
cp .env.example .env
```
Edit `.env` and fill in the required values:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/voice_ai_dev?schema=public"
NODE_ENV="development"

# İyzico — get these from https://sandbox.iyzipay.com → Settings → Company Settings
IYZICO_API_KEY="your_sandbox_api_key_here"
IYZICO_SECRET_KEY="your_sandbox_secret_key_here"
IYZICO_URI="https://sandbox-api.iyzipay.com"
```

Initialize the database and start the server:
```bash
npx prisma migrate dev
npx prisma generate
npm run seed
npm run dev
```
*The backend API will run on `http://localhost:3000`*

### 2. Frontend Setup (Admin Panel)
Open a **new** terminal window and navigate to the frontend directory:
```bash
cd admin-panel
npm install
```
Configure frontend environment variables:
```bash
cp .env.example .env
# Ensure your .env contains:
# VITE_API_BASE_URL="http://localhost:3000/api"
```
Start the Vite development server:
```bash
npm run dev
```
*The Admin Panel will run on `http://localhost:5173`*

## 💳 Payment Integration (İyzico)

The system uses **İyzico Checkout Form** to generate hosted payment pages for orders.

### Flow
1. `POST /api/payments/create-link` — Receives an `orderId`, builds the İyzico payload from the order's items/customer/address, and returns a `paymentUrl` + `token`.
2. The customer is redirected to the hosted İyzico checkout page.
3. After payment, İyzico POSTs to `callbackUrl`. The `PaymentTransaction` record is updated accordingly.

### API
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/payments/create-link` | `{ "orderId": 1 }` | Creates an İyzico checkout page and persists a `PENDING` payment transaction |

### Environment Variables
| Variable | Description |
|----------|-------------|
| `IYZICO_API_KEY` | API key from İyzico Sandbox / Production panel |
| `IYZICO_SECRET_KEY` | Secret key from İyzico Sandbox / Production panel |
| `IYZICO_URI` | `https://sandbox-api.iyzipay.com` (sandbox) or `https://api.iyzipay.com` (production) |

> **Sandbox keys** can be obtained from [sandbox.iyzipay.com](https://sandbox.iyzipay.com) → Settings → Company Settings.

### Database Model
Payment transactions are stored in the `PaymentTransaction` table and linked to their parent `Order` via the `payments` relation:

```prisma
model PaymentTransaction {
  provider      String   // e.g. "IYZICO"
  transactionId String   // İyzico token
  status        String   // PENDING | SUCCESS | FAILED
  order         Order    @relation(fields: [orderId], references: [id])
}
```

## 🧪 Instant API Testing
A pre-configured Postman suite (`postman_collection.json`) is included in the `backend` directory. Import it into Postman to instantly verify all core lifecycles, transactional edge cases, and Zod trigger validations.

## 🛡️ Architecture & Safeguards
* **Strict Input Validation:** All inbound API payloads pass through declarative `Zod` schemas (Fail-Fast Pipeline).
* **Centralized Error Handling:** Uncaught exceptions and ORM constraint violations are intercepted globally. Stack traces are strictly stripped in production.
* **Financial Integrity:** Order line items persist immutable checkout price snapshots (`unit_price`) server-side, ignoring client-computed totals.
* **State Machine:** Order lifecycle progression is strictly unidirectional.

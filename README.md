# Voice AI & Restaurant Automation System

A production-ready monorepo containing a Node.js/PostgreSQL backend service for voice-AI-driven food ordering, and a modern React (Vite) admin dashboard.

## 🚀 Technologies
* **Backend:** Node.js, Express.js, PostgreSQL, Prisma ORM, Zod v4, Pino
* **Frontend:** React, Vite, Tailwind CSS v4, React Router
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
# Ensure your .env contains:
# DATABASE_URL="postgresql://user:password@localhost:5432/voice_ai_dev?schema=public"
# NODE_ENV="development"
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

## 🧪 Instant API Testing
A pre-configured Postman suite (`postman_collection.json`) is included in the `backend` directory. Import it into Postman to instantly verify all core lifecycles, transactional edge cases, and Zod trigger validations.

## 🛡️ Architecture & Safeguards
* **Strict Input Validation:** All inbound API payloads pass through declarative `Zod` schemas (Fail-Fast Pipeline).
* **Centralized Error Handling:** Uncaught exceptions and ORM constraint violations are intercepted globally. Stack traces are strictly stripped in production.
* **Financial Integrity:** Order line items persist immutable checkout price snapshots (`unit_price`) server-side, ignoring client-computed totals.
* **State Machine:** Order lifecycle progression is strictly unidirectional.
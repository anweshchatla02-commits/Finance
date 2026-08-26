# Production-Ready Private Finance Management Web Application

Production Ready Next.js 14 + Prisma + Neon Cloud PostgreSQL App for Daily Collection Management.
Live Database URL connected and active.

A full-stack, secure, private finance and daily collection management web application built for daily money lending operations, borrower profiles, collection schedule generation, custom payment tracking, printable payment receipts, audit logs, and analytics.

---

## 🛠️ Technology Stack & Versions

- **Frontend**: Next.js 14.2.15 (App Router), React 18, TypeScript 5.6, Tailwind CSS 3.4, Lucide React icons, Recharts 2.13.
- **Backend & APIs**: Next.js Server Actions & API Route Handlers with Zod validation.
- **Database & ORM**: PostgreSQL database with Prisma ORM 5.22 (`@db.Decimal(12,2)` precision).
- **Authentication**: NextAuth.js 4.24 (Credentials Provider with bcrypt password hashing, secure session cookies, no public registration).
- **Testing**: Vitest test runner for business rules and financial math calculations.
- **Timezone & Locale**: Indian Standard Time (`Asia/Kolkata`) & Indian Currency (`en-IN` -> `₹20,000`, `₹1,25,000`).

---

## ⚡ Quick Setup & Development Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables Setup
Create a `.env` file in the project root (see `.env.example`):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/daily_finance?schema=public"
NEXTAUTH_SECRET="a4f89d31b2e67c80512f4b3e8c9d1a0b5c6d7e8f90123456789abcdef0123456"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Private Finance Manager"
NEXT_PUBLIC_CURRENCY="INR"
NEXT_PUBLIC_TIMEZONE="Asia/Kolkata"
```

### 3. Database Migration & Prisma Generation
```bash
npx prisma generate
npx prisma db push
```

### 4. Seed Initial Admin & Demo Data (Development Only)
```bash
npx ts-node prisma/seed.ts
```

### 5. Run Development Server
```bash
npm run dev
```

### 6. Run Financial Math Unit Tests
```bash
npm run test
```

### 7. Run Production Build
```bash
npm run build
```

---

## 🔑 Development Admin Credentials

- **Email / Username**: `admin@finance.local`
- **Password**: `admin123`

---

## 🧮 How Finance Calculations Work

1. **Amount Given ($A_G$)**: e.g., ₹20,000
2. **Total Amount To Collect ($A_T$)**: e.g., ₹24,000
3. **Daily Collection Amount ($A_D$)**: e.g., ₹300/day
4. **Extra / Profit Amount ($P$)**: `Total Amount To Collect - Amount Given` = `₹24,000 - ₹20,000 = ₹4,000`.
5. **Collection Schedule Generation**:
   - **Exact Division**: ₹24,000 / ₹300 = **80 payments of ₹300**.
   - **Non-Exact Division**: ₹10,000 / ₹300 = **33 payments of ₹300 + 1 final payment of ₹100** ($33 \times 300 = 9900$, remainder ₹100).
   - **Discrepancy Safeguard**: Real-time warnings during loan creation flag input mismatches and auto-adjust the final payment day without exceeding the total agreed collection.

---

## 💳 How Payments & Missed Payments are Handled

- **Decoupled Missed Payments**: If a borrower misses a payment on a scheduled date, that date is flagged as `MISSED` or `PENDING`. Missed amounts are **NOT** automatically added to loan principal or rolled over arbitrarily.
- **Payment Collection**:
  - **Quick Mark Paid**: 1-click button to record expected daily collection amount.
  - **Custom Payment Modal**: Allows recording partial payments (e.g. ₹200) or excess payments with an explicit overpayment safety check.
- **Auto-Completion**: When cumulative payments reach the total agreed amount, the finance loan status automatically updates to `COMPLETED`.

---

## 📦 Database Backup & Recovery Strategy

1. **Admin JSON Backup Export**: Click "Download Database JSON Backup" on the Settings page (`/settings`) or fetch `/api/backup` to download a full structured JSON archive.
2. **CSV Reports Export**: Export customers, finances, and payment transaction logs to CSV from the Reports page (`/reports`).
3. **Automated Server Backups (`pg_dump`)**:
   ```bash
   pg_dump -U postgres -d daily_finance > backup_$(date +%Y%m%d).sql
   ```

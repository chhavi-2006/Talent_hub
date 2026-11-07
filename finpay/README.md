# FinPay — Campus Digital Wallet & Payments Platform

FinPay is an enterprise-grade campus digital wallet, payment gateway, and cashback system designed around monetary precision, tiered multipliers, monthly category limits, idempotency safety, and automated financial reconciliation.

---

## 🎯 Core Mathematical & Architectural Principles

### 1. Integer Paise Precision (Zero Floating-Point Drift)
- Monetary transactions and balances are strictly recorded as **integer paise** ($₹1.00 = 100\text{ paise}$).
- Division operations always apply mathematical **floor truncation** (`math.floor`), avoiding fraction accumulation errors.
  *Example:* $₹3.33$ payment at $2.0\%$ base rate $= 6.66\text{ paise} \rightarrow \mathbf{6\text{ paise}}$ (not rounded to 7).

### 2. Wallet Tiers & Multipliers
| Wallet Tier | Cashback-Rate Multiplier | Monthly-Cap Multiplier | Visual Persona Theme |
|---|---|---|---|
| **BASIC** | $1.0\times$ | $1.0\times$ | Metallic Titanium Silver |
| **PRIME** | $1.5\times$ | $1.5\times$ | Electric Cobalt / Royal Blue |
| **PREMIUM** | $2.0\times$ | $2.0\times$ | Obsidian Black & Brushed Gold |

### 3. Category Rules & Monthly Caps
| Merchant Category | Base Rate | BASIC Cap ($1.0\times$) | PRIME Cap ($1.5\times$) | PREMIUM Cap ($2.0\times$) |
|---|---|---|---|---|
| **Canteen** | 2.0% | ₹50 (5,000 p) | ₹75 (7,500 p) | ₹100 (10,000 p) |
| **Stationery** | 1.0% | ₹20 (2,000 p) | ₹30 (3,000 p) | ₹40 (4,000 p) |
| **Transport** | 3.0% | ₹100 (10,000 p) | ₹150 (15,000 p) | ₹200 (20,000 p) |
| **Hostel** | 0.5% | ₹200 (20,000 p) | ₹300 (30,000 p) | ₹400 (40,000 p) |
| **Online** | 1.0% | ₹30 (3,000 p) | ₹45 (4,500 p) | ₹60 (6,000 p) |
| **Top-Up** | 0.0% | ₹0 (No cashback) | ₹0 | ₹0 |

### 4. Two-Stage Cashback Processing
$$\text{Raw Cashback} = \lfloor \frac{\text{Amount (paise)} \times (\text{Base Rate} \times \text{Tier Rate Mult})}{100} \rfloor$$
$$\text{Actual Cashback} = \min(\text{Raw Cashback},\; \max(0, \text{Monthly Cap} - \text{Current Month Category Total}))$$

### 5. Idempotency Safety
- Every transaction accepts a unique `idempotency_key`.
- Network retries or rapid double-clicks return the cached payload without double-debiting the student or double-crediting cashback.

### 6. Double-Entry General Ledger & Automated Reconciliation
- Every transaction generates symmetric double-entry rows:
  - `DEBIT` Student Wallet (Gross purchase)
  - `CREDIT` Merchant Wallet (Gross settlement)
  - `CREDIT` Student Wallet (Capped cashback promotional disbursement)
- Auditor engine verifies $\Delta\text{Wallet Balance} = \sum\text{Credits} - \sum\text{Debits}$ with zero variance.

---

## 🏗️ System Architecture

```
finpay/
├── backend/
│   ├── app/
│   │   ├── api/             # REST Routers (auth, wallet, payments, merchants, reconciliation)
│   │   ├── core/            # Config, Async SQLite (WAL & foreign keys), Security
│   │   ├── models/          # SQLAlchemy Models (User, Wallet, Merchant, Transaction, LedgerEntry)
│   │   ├── schemas/         # Pydantic Schemas with integer paise validation
│   │   ├── services/
│   │   │   ├── cashback_service.py       # Pure calculate_cashback() algorithm (math.floor & paise)
│   │   │   ├── payment_service.py        # Atomic process_payment() with idempotency & caps
│   │   │   └── reconciliation_service.py # General ledger mathematical auditor
│   │   ├── seed.py          # Auto-seeding of users, wallets, merchants, and audited ledger
│   │   └── main.py          # FastAPI application entrypoint (port 8001)
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── api/client.js    # Axios client with JWT & automatic 401 redirect
    │   ├── components/
    │   │   ├── VirtualCard.jsx          # Physical-style smart card (Silver/Cobalt/Gold)
    │   │   ├── CashbackGauge.jsx        # Category monthly limits progress bars
    │   │   ├── QuickPayModal.jsx        # POS payment with live calculation preview
    │   │   ├── TopUpModal.jsx           # Zero-fee wallet loading dialog
    │   │   ├── TierUpgradeModal.jsx     # Live tier & multiplier simulator
    │   │   └── TransactionTable.jsx     # Transaction ledger with double-entry inspector
    │   ├── pages/
    │   │   ├── Login.jsx                # 1-Click demo account switcher
    │   │   ├── StudentDashboard.jsx     # Main wallet hub
    │   │   ├── MerchantTerminal.jsx     # POS QR bill terminal for campus vendors
    │   │   └── Reconciliation.jsx       # University financial audit & ledger records
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js       # Runs on port 5175 (zero conflict with ports 5173/5174/8000)
```

---

## 🚀 How to Run FinPay

### 1. Start the Backend (Terminal 1)

```bash
cd finpay/backend

# Activate the shared virtual environment
source ../../backend/venv/bin/activate

# Launch the FastAPI service on port 8001
uvicorn main:app --reload --port 8001
```

- **Interactive API Docs (Swagger):** `http://127.0.0.1:8001/docs`
- **Health Check:** `http://127.0.0.1:8001/health`

### 2. Start the Frontend (Terminal 2)

```bash
cd finpay/frontend

# Launch the Vite development server on port 5175
npm run dev
```

- **Access the Web App:** Open `http://localhost:5175` in your browser.

---

## 👥 Seed Demo Accounts

All demo accounts use password: **`password123`** (available with 1-click on the login screen).

| Persona | Name | Email | Tier / Role | Highlights |
|---|---|---|---|---|
| **Student** | Rahul Sharma | `rahul@student.finpay.edu` | `BASIC` | 1.0× multiplier, ₹1,500 initial float |
| **Student** | Priya Nair | `priya@student.finpay.edu` | `PRIME` | 1.5× multiplier, ₹4,000 initial float |
| **Student** | Sneha Patil | `sneha@student.finpay.edu` | `PREMIUM` | 2.0× multiplier, ₹8,000 initial float |
| **Merchant POS** | Campus Canteen | `canteen@merchants.finpay.edu` | `CANTEEN` | POS bill generator & incoming settlements |
| **Auditor** | Finance Officer | `auditor@finpay.edu` | `AUDITOR` | Live ledger reconciliation & audit reports |

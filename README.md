# Transaction & Ranking System

A full-stack financial ledger with real-time weighted scoring and leaderboard.

## Live Demo
- **Frontend (Vercel):** [https://assignement2-five.vercel.app/]
- **Backend (Render):** [https://transaction-backend-tw1d.onrender.com]

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Python + FastAPI |
| Database | Supabase (PostgreSQL) |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

## Deployment

### 1. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `backend/schema.sql` to create all tables and seed demo users
3. Go to **Settings → API Keys** and copy your `service_role` secret key

### 2. Backend on Render
1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect this GitHub repo
3. Configure:
   - **Root Directory:** `backend`
   - **Runtime:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add **Environment Variables:**
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_SERVICE_KEY` = your service_role secret key
5. Deploy — note down the Render URL (e.g. `https://your-app.onrender.com`)

### 3. Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) → **Import Project**
2. Connect this GitHub repo
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js
4. Add **Environment Variable:**
   - `NEXT_PUBLIC_API_URL` = your Render backend URL (from step 2)
5. Deploy

## API Reference

### POST /transaction
Submit a new credit or debit transaction.

**Request Body:**
```json
{
  "user_id": "uuid",
  "amount": 500.00,
  "type": "credit",
  "description": "Salary payment",
  "idempotency_key": "unique-key-123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "transaction_id": "uuid",
  "user_id": "uuid",
  "type": "credit",
  "amount": 500.00,
  "new_balance": 1500.00,
  "message": "Transaction processed successfully",
  "duplicate": false
}
```

**Error Codes:** `400` (invalid input / insufficient balance), `404` (user not found), `409` (duplicate request in progress), `500` (server error)

### GET /summary/{user_id}
Get a user's financial dashboard with balance, stats, and recent transactions.

**Response (200):**
```json
{
  "user_id": "uuid",
  "name": "Rahul Sharma",
  "email": "rahul@demo.com",
  "total_amount": 1500.00,
  "transaction_count": 5,
  "total_credited": 2000.00,
  "total_debited": 500.00,
  "average_transaction": 300.00,
  "member_since": "2024-01-01T00:00:00Z",
  "last_transaction_at": "2024-06-20T10:30:00Z",
  "recent_transactions": [...]
}
```

### GET /ranking
Get the leaderboard with weighted scores for all users.

**Response (200):**
```json
{
  "ranking": [
    {
      "rank": 1,
      "user_id": "uuid",
      "name": "Rahul Sharma",
      "score": 0.87,
      "total_amount": 2500.00,
      "transaction_count": 18,
      "score_breakdown": {
        "balance_score": 0.95,
        "consistency_score": 0.88,
        "frequency_score": 0.79,
        "longevity_score": 0.65
      }
    }
  ],
  "total_users": 5,
  "generated_at": "2024-06-24T12:00:00Z"
}
```

## How Ranking Works

**Score = (balance × 0.40) + (credit consistency × 0.30) + (log frequency × 0.20) + (longevity × 0.10)**

| Factor | Weight | What it Measures |
|--------|--------|-----------------|
| **Balance** | 40% | Higher total amount = higher score |
| **Consistency** | 30% | Ratio of credits to total transactions — penalizes debit spamming |
| **Frequency** | 20% | Log-scaled transaction count — first 10 matter more than 90–100 |
| **Longevity** | 10% | Older accounts score higher — prevents new accounts from gaming the board |

## How Duplicate Requests Are Prevented
Every request includes a client-generated `idempotency_key`. The backend checks the `idempotency_keys` table before processing:
- **Key not found** → process normally, store result
- **Key status = `processing`** → return `409` (another request is in flight)
- **Key status = `done`** → return stored result immediately, skip processing

The unique constraint on the key column also prevents race conditions at the database level.

## How Concurrency Is Handled
`asyncio.Lock()` per `user_id` is stored in a global dict. Two simultaneous requests for the same user queue up — the second waits for the first to finish. This prevents double-spend on debit transactions and balance corruption.

## Assumptions
- No JWT auth — `user_id` is passed directly (demo system)
- 5 demo users are seeded via SQL for testing
- Amounts are treated as INR (₹)
- `asyncio` locks are in-memory — they reset on server restart (Redis recommended for production)
- All timestamps are in UTC

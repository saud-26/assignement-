# Transaction & Ranking System

## Live Demo
- Frontend: [Vercel URL]
- Backend: [Render URL]

## Run Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your Supabase credentials in .env
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

## API Reference

### POST /transaction
Accepts: `user_id`, `amount`, `type` (credit/debit), `description`, `idempotency_key`
Returns: `transaction_id`, `new_balance`, success status
Errors: 400 (invalid/insufficient), 404 (user not found), 409 (duplicate in flight), 500

### GET /summary/:userId
Returns: balance, transaction count, credited total, debited total, recent transactions

### GET /ranking
Returns: leaderboard sorted by weighted score

## How Ranking Works
Score = (balance × 0.40) + (credit consistency × 0.30) + (log frequency × 0.20) + (longevity × 0.10)

- **Balance**: higher total amount = higher score
- **Consistency**: ratio of credits to total transactions — penalizes debit spamming
- **Frequency**: log scale — first 10 transactions matter more than transactions 90-100
- **Longevity**: older accounts score higher — prevents brand new accounts from gaming the board

## How Duplicate Requests Are Prevented
Every request includes a client-generated `idempotency_key`.
Backend checks `idempotency_keys` table before processing:
- key not found → process normally, store result
- key status = processing → return 409 (another request in flight)  
- key status = done → return stored result immediately, skip processing
The unique constraint on the key column also prevents race conditions at DB level.

## How Concurrency Is Handled
`asyncio.Lock()` per user_id is stored in a global dict.
Two simultaneous requests for the same user queue up — second waits for first to finish.
This prevents double-spend on debit transactions and balance corruption.

## Assumptions
- No JWT auth — user_id passed directly (demo system)
- Amounts treated as INR
- `asyncio` locks are in-memory — reset on server restart (Redis recommended for production)
- All timestamps in UTC

## Deployment

**Backend on Render**:
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

**Frontend on Vercel**:
- Root directory: `frontend`
- Framework preset: Next.js
- Environment variable: `NEXT_PUBLIC_API_URL` = your Render backend URL

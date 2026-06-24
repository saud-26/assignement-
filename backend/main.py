import asyncio
import time
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from routers import transactions, summary, ranking
from routers.transactions import set_user_locks

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Transaction & Ranking System",
    description="A full-stack transaction processing and user ranking API",
    version="1.0.0",
)

# Global per-user lock dictionary for concurrency control
user_locks: dict[str, asyncio.Lock] = {}

# Pass the lock reference to the transactions router
set_user_locks(user_locks)

# CORS middleware — allow all origins for demo purposes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = round((time.time() - start_time) * 1000, 2)
    logger.info(
        f"{request.method} {request.url.path} → {response.status_code} ({duration}ms)"
    )
    return response


# Include routers
app.include_router(transactions.router, tags=["Transactions"])
app.include_router(summary.router, tags=["Summary"])
app.include_router(ranking.router, tags=["Ranking"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "Transaction & Ranking System API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

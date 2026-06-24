import uuid
import logging
from fastapi import APIRouter, HTTPException

from models import TransactionRequest
from database import get_supabase
from services.idempotency import (
    check_idempotency_key,
    create_idempotency_key,
    update_idempotency_key,
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Reference to the global user_locks dict — set from main.py
user_locks = None


def set_user_locks(locks: dict):
    """Set the reference to global user_locks from main.py."""
    global user_locks
    user_locks = locks


@router.post("/transaction")
async def create_transaction(req: TransactionRequest):
    """
    Process a financial transaction with full idempotency and concurrency control.
    """
    sb = get_supabase()

    # STEP 1 — Validate UUID format
    try:
        uuid.UUID(req.user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id format. Must be a valid UUID.")

    # STEP 2 — Idempotency check
    existing_key = check_idempotency_key(req.idempotency_key)
    if existing_key:
        if existing_key["status"] == "done":
            response = existing_key.get("response_data", {})
            response["duplicate"] = True
            return response
        elif existing_key["status"] == "processing":
            raise HTTPException(status_code=409, detail="Request is already being processed")

    # Insert new idempotency key with status 'processing'
    try:
        create_idempotency_key(req.idempotency_key, req.user_id)
    except Exception as e:
        # If insertion fails due to unique constraint, another request beat us
        logger.warning(f"Idempotency key insertion failed: {e}")
        raise HTTPException(status_code=409, detail="Request is already being processed")

    # STEP 3 — Acquire asyncio.Lock for user_id
    import asyncio
    if user_locks is not None:
        if req.user_id not in user_locks:
            user_locks[req.user_id] = asyncio.Lock()
        lock = user_locks[req.user_id]
    else:
        lock = asyncio.Lock()

    try:
        async with lock:
            # STEP 4 — Fetch user
            user_result = sb.table("users").select("*").eq("id", req.user_id).execute()
            if not user_result.data or len(user_result.data) == 0:
                error_response = {"success": False, "detail": "User not found"}
                update_idempotency_key(req.idempotency_key, "done", error_response)
                raise HTTPException(status_code=404, detail="User not found")

            user = user_result.data[0]
            current_balance = float(user.get("total_amount", 0) or 0)
            current_tx_count = int(user.get("transaction_count", 0) or 0)

            # STEP 5 — Check balance for debit
            if req.type == "debit" and current_balance < req.amount:
                error_response = {"success": False, "detail": "Insufficient balance"}
                update_idempotency_key(req.idempotency_key, "done", error_response)
                raise HTTPException(status_code=400, detail="Insufficient balance")

            # STEP 6 — Insert transaction
            tx_result = sb.table("transactions").insert({
                "user_id": req.user_id,
                "amount": req.amount,
                "type": req.type,
                "description": req.description,
                "idempotency_key": req.idempotency_key,
            }).execute()

            transaction_id = tx_result.data[0]["id"] if tx_result.data else str(uuid.uuid4())

            # STEP 7 — Update user balance and transaction count
            if req.type == "credit":
                new_balance = current_balance + req.amount
            else:
                new_balance = current_balance - req.amount
            new_tx_count = current_tx_count + 1

            sb.table("users").update({
                "total_amount": new_balance,
                "transaction_count": new_tx_count,
            }).eq("id", req.user_id).execute()

            # STEP 8 — Build success response
            success_response = {
                "success": True,
                "transaction_id": transaction_id,
                "user_id": req.user_id,
                "type": req.type,
                "amount": req.amount,
                "new_balance": new_balance,
                "message": "Transaction processed successfully",
                "duplicate": False,
            }

            # STEP 9 — Update idempotency key to done
            update_idempotency_key(req.idempotency_key, "done", success_response)

            # STEP 10 — Return response
            return success_response

    except HTTPException:
        raise
    except Exception as e:
        # Unexpected exception handling
        logger.error(f"Unexpected error processing transaction: {e}", exc_info=True)
        error_payload = {"success": False, "detail": "Internal server error"}
        try:
            update_idempotency_key(req.idempotency_key, "done", error_payload)
        except Exception:
            logger.error("Failed to update idempotency key on error")
        raise HTTPException(status_code=500, detail="Internal server error")

import uuid
import logging
from fastapi import APIRouter, HTTPException

from database import get_supabase

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/summary/{user_id}")
async def get_user_summary(user_id: str):
    """
    Get a comprehensive summary of a user's financial activity.
    """
    sb = get_supabase()

    # STEP 1 — Validate UUID format
    try:
        uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id format. Must be a valid UUID.")

    # STEP 2 — Fetch user
    user_result = sb.table("users").select("*").eq("id", user_id).execute()
    if not user_result.data or len(user_result.data) == 0:
        raise HTTPException(status_code=404, detail="User not found")

    user = user_result.data[0]

    # STEP 3 — Fetch all transactions ordered by created_at DESC
    tx_result = (
        sb.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    transactions = tx_result.data or []

    # STEP 4 — Compute aggregates
    total_credited = sum(float(tx["amount"]) for tx in transactions if tx["type"] == "credit")
    total_debited = sum(float(tx["amount"]) for tx in transactions if tx["type"] == "debit")

    total_amount = float(user.get("total_amount", 0) or 0)
    transaction_count = int(user.get("transaction_count", 0) or 0)

    if transaction_count > 0:
        average_transaction = round(total_amount / transaction_count, 2)
    else:
        average_transaction = 0

    last_transaction_at = transactions[0]["created_at"] if transactions else None

    # STEP 5 — Build and return response
    recent_transactions = [
        {
            "id": tx["id"],
            "amount": float(tx["amount"]),
            "type": tx["type"],
            "description": tx.get("description", ""),
            "created_at": tx["created_at"],
        }
        for tx in transactions
    ]

    return {
        "user_id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "total_amount": total_amount,
        "transaction_count": transaction_count,
        "total_credited": total_credited,
        "total_debited": total_debited,
        "average_transaction": average_transaction,
        "member_since": user["created_at"],
        "last_transaction_at": last_transaction_at,
        "recent_transactions": recent_transactions,
    }

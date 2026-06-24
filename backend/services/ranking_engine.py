import math
from datetime import datetime, timezone
from database import get_supabase


def compute_rankings():
    """
    Compute rankings for all users based on weighted scoring:
      - Balance Score (40%): normalized by max balance
      - Consistency Score (30%): ratio of credit transactions to total
      - Frequency Score (20%): log-scaled transaction count
      - Longevity Score (10%): account age normalized by max age
    """
    sb = get_supabase()

    # STEP 1 — Fetch all users
    users_result = sb.table("users").select("*").execute()
    users = users_result.data or []

    if not users:
        return {
            "ranking": [],
            "total_users": 0,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }

    # STEP 2 — For each user, fetch credit transaction count
    user_credit_counts = {}
    for user in users:
        credit_result = (
            sb.table("transactions")
            .select("id", count="exact")
            .eq("user_id", user["id"])
            .eq("type", "credit")
            .execute()
        )
        user_credit_counts[user["id"]] = credit_result.count or 0

    # STEP 3 — Compute normalized scores
    now = datetime.now(timezone.utc)

    # Parse created_at timestamps
    for user in users:
        if isinstance(user["created_at"], str):
            # Handle various timestamp formats from Supabase
            created_str = user["created_at"]
            try:
                user["_created_dt"] = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
            except ValueError:
                user["_created_dt"] = now

    max_balance = max(float(u.get("total_amount", 0) or 0) for u in users) or 1
    max_tx_count = max(int(u.get("transaction_count", 0) or 0) for u in users) or 1
    max_days = max((now - u["_created_dt"]).days for u in users) or 1

    ranking_list = []
    for user in users:
        total_amount = float(user.get("total_amount", 0) or 0)
        transaction_count = int(user.get("transaction_count", 0) or 0)
        credit_count = user_credit_counts.get(user["id"], 0)
        days_active = (now - user["_created_dt"]).days

        balance_score = total_amount / max_balance
        consistency_score = credit_count / transaction_count if transaction_count > 0 else 0
        frequency_score = math.log(transaction_count + 1) / math.log(max_tx_count + 1)
        longevity_score = days_active / max_days

        final_score = (
            balance_score * 0.40 +
            consistency_score * 0.30 +
            frequency_score * 0.20 +
            longevity_score * 0.10
        )

        ranking_list.append({
            "user_id": user["id"],
            "name": user["name"],
            "score": round(final_score, 4),
            "total_amount": total_amount,
            "transaction_count": transaction_count,
            "score_breakdown": {
                "balance_score": round(balance_score, 4),
                "consistency_score": round(consistency_score, 4),
                "frequency_score": round(frequency_score, 4),
                "longevity_score": round(longevity_score, 4)
            }
        })

    # STEP 4 — Sort by final_score descending and assign rank
    ranking_list.sort(key=lambda x: x["score"], reverse=True)
    for i, entry in enumerate(ranking_list):
        entry["rank"] = i + 1

    # STEP 5 — Return result
    return {
        "ranking": ranking_list,
        "total_users": len(ranking_list),
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

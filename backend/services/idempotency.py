from database import get_supabase


def check_idempotency_key(key: str):
    """
    Check if an idempotency key already exists.
    Returns the row if found, None otherwise.
    """
    sb = get_supabase()
    result = sb.table("idempotency_keys").select("*").eq("key", key).execute()
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None


def create_idempotency_key(key: str, user_id: str):
    """
    Insert a new idempotency key with status 'processing'.
    """
    sb = get_supabase()
    sb.table("idempotency_keys").insert({
        "key": key,
        "status": "processing",
        "user_id": user_id
    }).execute()


def update_idempotency_key(key: str, status: str, response_data: dict):
    """
    Update an idempotency key with final status and response data.
    """
    sb = get_supabase()
    sb.table("idempotency_keys").update({
        "status": status,
        "response_data": response_data
    }).eq("key", key).execute()

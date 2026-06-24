from pydantic import BaseModel, Field
from typing import Literal


class TransactionRequest(BaseModel):
    user_id: str
    amount: float = Field(..., gt=0, description="Must be greater than 0")
    type: Literal["credit", "debit"]
    description: str = ""
    idempotency_key: str = Field(..., min_length=1)

from typing import List, Optional

from pydantic import BaseModel


class PromoValidateRequest(BaseModel):
    code: str
    amount: float


class PromoValidateResponse(BaseModel):
    valid: bool
    code: str
    discount: float = 0.0
    message: str = ""


class PromoOut(BaseModel):
    code: str
    description: str
    discount_type: str
    discount_value: float
    min_amount: float

    class Config:
        from_attributes = True


class CheckoutRequest(BaseModel):
    amount: float
    method: str = "card"
    promo_code: Optional[str] = None


class CheckoutResponse(BaseModel):
    status: str
    transaction_id: str
    amount: float

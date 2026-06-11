from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel


class HoldRequest(BaseModel):
    showtime_id: int
    seat_ids: List[int]


class HoldResponse(BaseModel):
    hold_id: str
    showtime_id: int
    seat_ids: List[int]
    seats: List[Any]
    subtotal: float
    convenience_fee: float
    expires_in: int


class ConfirmRequest(BaseModel):
    booking_type: str = "movie"
    showtime_id: Optional[int] = None
    event_id: Optional[int] = None
    seat_ids: List[int] = []
    quantity: int = 0
    title: str = ""
    venue: str = ""
    show_datetime: str = ""
    discount: float = 0.0
    promo_code: Optional[str] = None
    # event line items
    unit_price: float = 0.0


class BookingOut(BaseModel):
    id: int
    user_id: int
    booking_type: str
    showtime_id: Optional[int]
    event_id: Optional[int]
    title: str
    venue: str
    show_datetime: str
    seats: List[Any]
    quantity: int
    subtotal: float
    convenience_fee: float
    discount: float
    total: float
    status: str
    booking_ref: str
    created_at: datetime

    class Config:
        from_attributes = True

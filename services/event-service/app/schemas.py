from datetime import date, time
from typing import Any, List, Optional

from pydantic import BaseModel


class EventBase(BaseModel):
    title: str
    description: str = ""
    category: str
    city: str
    venue_name: str = ""
    venue_address: str = ""
    date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    image_url: Optional[str] = None
    artists: List[Any] = []
    price_from: float = 0.0
    price_to: float = 0.0
    available_tickets: int = 0
    total_tickets: int = 0


class EventCreate(EventBase):
    pass


class EventOut(EventBase):
    id: int

    class Config:
        from_attributes = True

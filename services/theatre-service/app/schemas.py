from datetime import date, time
from typing import List, Optional

from pydantic import BaseModel


class TheatreOut(BaseModel):
    id: int
    name: str
    chain: str
    city: str
    address: str
    amenities: List[str]

    class Config:
        from_attributes = True


class ShowtimeOut(BaseModel):
    id: int
    movie_id: int
    date: date
    start_time: time
    available_seats: int
    total_seats: int
    status: str
    format: str

    class Config:
        from_attributes = True


class TheatreWithShowtimes(BaseModel):
    theatre: TheatreOut
    showtimes: List[ShowtimeOut]


class SeatOut(BaseModel):
    id: int
    row_label: str
    col_number: int
    category: str
    price: float
    status: str  # available | booked | held


class SeatCategory(BaseModel):
    name: str
    price: float


class SeatMapOut(BaseModel):
    showtime_id: int
    movie_id: int
    screen_name: str
    format: str
    theatre_name: str
    rows: int
    cols: int
    categories: List[SeatCategory]
    seats: List[SeatOut]


class ShowtimeDetail(BaseModel):
    id: int
    movie_id: int
    date: date
    start_time: time
    format: str
    screen_name: str
    theatre_id: int
    theatre_name: str
    theatre_city: str
    theatre_address: str

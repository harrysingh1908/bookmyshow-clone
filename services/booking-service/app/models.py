from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB

from .database import SCHEMA, Base


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = {"schema": SCHEMA}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    booking_type = Column(String, nullable=False, default="movie")  # movie | event
    showtime_id = Column(Integer, nullable=True, index=True)
    event_id = Column(Integer, nullable=True, index=True)
    title = Column(String, nullable=False, default="")
    venue = Column(String, nullable=False, default="")
    show_datetime = Column(String, nullable=False, default="")
    seats = Column(JSONB, nullable=False, default=list)
    quantity = Column(Integer, nullable=False, default=0)
    subtotal = Column(Float, nullable=False, default=0.0)
    convenience_fee = Column(Float, nullable=False, default=0.0)
    addons = Column(Float, nullable=False, default=0.0)
    discount = Column(Float, nullable=False, default=0.0)
    total = Column(Float, nullable=False, default=0.0)
    status = Column(String, nullable=False, default="confirmed")  # confirmed | cancelled
    booking_ref = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class BookingSeat(Base):
    __tablename__ = "booking_seats"
    __table_args__ = {"schema": SCHEMA}

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey(f"{SCHEMA}.bookings.id"), nullable=False)
    showtime_id = Column(Integer, nullable=False, index=True)
    seat_id = Column(Integer, nullable=False, index=True)
    status = Column(String, nullable=False, default="booked")  # booked | cancelled

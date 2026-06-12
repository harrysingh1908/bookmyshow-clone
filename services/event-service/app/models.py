from datetime import date, time

from sqlalchemy import Column, Date, Float, Integer, String, Text, Time
from sqlalchemy.dialects.postgresql import JSONB

from .database import SCHEMA, Base


class Event(Base):
    __tablename__ = "events"
    __table_args__ = {"schema": SCHEMA}

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False, default="")
    category = Column(String, nullable=False, index=True)
    city = Column(String, nullable=False, index=True)
    venue_name = Column(String, nullable=False, default="")
    venue_address = Column(String, nullable=False, default="")
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    image_url = Column(String, nullable=True)
    artists = Column(JSONB, nullable=False, default=list)
    price_from = Column(Float, nullable=False, default=0.0)
    price_to = Column(Float, nullable=False, default=0.0)
    available_tickets = Column(Integer, nullable=False, default=0)
    total_tickets = Column(Integer, nullable=False, default=0)

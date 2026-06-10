from datetime import date, datetime

from sqlalchemy import (
    ARRAY,
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB

from .database import SCHEMA, Base


class Movie(Base):
    __tablename__ = "movies"
    __table_args__ = {"schema": SCHEMA}

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False, default="")
    duration_mins = Column(Integer, nullable=False, default=120)
    languages = Column(ARRAY(String), nullable=False, default=list)
    genres = Column(ARRAY(String), nullable=False, default=list)
    formats = Column(ARRAY(String), nullable=False, default=list)
    certificate = Column(String, nullable=False, default="UA")
    release_date = Column(Date, nullable=True)
    poster_url = Column(String, nullable=True)
    banner_url = Column(String, nullable=True)
    trailer_url = Column(String, nullable=True)
    cast = Column(JSONB, nullable=False, default=list)
    avg_rating = Column(Float, nullable=False, default=0.0)
    vote_count = Column(Integer, nullable=False, default=0)
    is_upcoming = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

from datetime import date, time

from sqlalchemy import (
    ARRAY,
    Column,
    Date,
    Float,
    ForeignKey,
    Integer,
    String,
    Time,
)
from sqlalchemy.orm import relationship

from .database import SCHEMA, Base


class Theatre(Base):
    __tablename__ = "theatres"
    __table_args__ = {"schema": SCHEMA}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    chain = Column(String, nullable=False)
    city = Column(String, nullable=False, index=True)
    address = Column(String, nullable=False, default="")
    amenities = Column(ARRAY(String), nullable=False, default=list)

    screens = relationship("Screen", back_populates="theatre", cascade="all, delete")


class Screen(Base):
    __tablename__ = "screens"
    __table_args__ = {"schema": SCHEMA}

    id = Column(Integer, primary_key=True, index=True)
    theatre_id = Column(Integer, ForeignKey(f"{SCHEMA}.theatres.id"), nullable=False)
    name = Column(String, nullable=False)
    format = Column(String, nullable=False, default="2D")
    rows = Column(Integer, nullable=False, default=8)
    cols = Column(Integer, nullable=False, default=12)

    theatre = relationship("Theatre", back_populates="screens")
    seats = relationship("Seat", back_populates="screen", cascade="all, delete")


class Seat(Base):
    __tablename__ = "seats"
    __table_args__ = {"schema": SCHEMA}

    id = Column(Integer, primary_key=True, index=True)
    screen_id = Column(Integer, ForeignKey(f"{SCHEMA}.screens.id"), nullable=False)
    row_label = Column(String, nullable=False)
    col_number = Column(Integer, nullable=False)
    category = Column(String, nullable=False, default="Silver")
    price = Column(Float, nullable=False, default=200.0)

    screen = relationship("Screen", back_populates="seats")


class Showtime(Base):
    __tablename__ = "showtimes"
    __table_args__ = {"schema": SCHEMA}

    id = Column(Integer, primary_key=True, index=True)
    screen_id = Column(Integer, ForeignKey(f"{SCHEMA}.screens.id"), nullable=False)
    movie_id = Column(Integer, nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    available_seats = Column(Integer, nullable=False, default=0)
    total_seats = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="available")

    screen = relationship("Screen")

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from .database import SCHEMA, Base


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = {"schema": SCHEMA}

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=False)
    author_name = Column(String, nullable=False, default="Anonymous")
    rating = Column(Integer, nullable=False, default=5)
    title = Column(String, nullable=False, default="")
    body = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

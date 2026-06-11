from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from .database import SCHEMA, Base


class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = {"schema": SCHEMA}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    amount = Column(Float, nullable=False)
    method = Column(String, nullable=False, default="card")
    status = Column(String, nullable=False, default="success")
    transaction_id = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class PromoCode(Base):
    __tablename__ = "promo_codes"
    __table_args__ = {"schema": SCHEMA}

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)
    description = Column(String, nullable=False, default="")
    discount_type = Column(String, nullable=False, default="pct")  # pct | flat
    discount_value = Column(Float, nullable=False, default=0.0)
    min_amount = Column(Float, nullable=False, default=0.0)
    max_discount = Column(Float, nullable=False, default=0.0)  # cap for pct, 0 = no cap
    max_uses = Column(Integer, nullable=False, default=1000)
    used_count = Column(Integer, nullable=False, default=0)

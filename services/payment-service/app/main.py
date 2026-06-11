import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from sqlalchemy.orm import Session

from .database import get_db, init_db
from .models import Payment, PromoCode
from .schemas import (
    CheckoutRequest,
    CheckoutResponse,
    PromoOut,
    PromoValidateRequest,
    PromoValidateResponse,
)

app = FastAPI(title="Payment Service")


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "payment"}


def _compute_discount(promo: PromoCode, amount: float) -> float:
    if promo.discount_type == "flat":
        discount = promo.discount_value
    else:  # pct
        discount = amount * (promo.discount_value / 100.0)
        if promo.max_discount and discount > promo.max_discount:
            discount = promo.max_discount
    return round(min(discount, amount), 2)


@app.post("/payments/validate-promo", response_model=PromoValidateResponse)
def validate_promo(payload: PromoValidateRequest, db: Session = Depends(get_db)):
    promo = (
        db.query(PromoCode)
        .filter(PromoCode.code == payload.code.strip().upper())
        .first()
    )
    if not promo:
        return PromoValidateResponse(valid=False, code=payload.code, message="Invalid promo code")
    if promo.used_count >= promo.max_uses:
        return PromoValidateResponse(valid=False, code=promo.code, message="Promo code exhausted")
    if payload.amount < promo.min_amount:
        return PromoValidateResponse(
            valid=False,
            code=promo.code,
            message=f"Minimum order of ₹{promo.min_amount:.0f} required",
        )
    discount = _compute_discount(promo, payload.amount)
    return PromoValidateResponse(
        valid=True,
        code=promo.code,
        discount=discount,
        message=f"You saved ₹{discount:.0f}!",
    )


@app.get("/payments/offers", response_model=List[PromoOut])
def list_offers(db: Session = Depends(get_db)):
    return db.query(PromoCode).order_by(PromoCode.discount_value.desc()).all()


@app.post("/payments/checkout", response_model=CheckoutResponse)
def checkout(
    payload: CheckoutRequest,
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    # mock gateway — always succeeds
    if payload.promo_code:
        promo = (
            db.query(PromoCode)
            .filter(PromoCode.code == payload.promo_code.strip().upper())
            .first()
        )
        if promo and promo.used_count < promo.max_uses:
            promo.used_count += 1

    txn = "TXN" + uuid.uuid4().hex[:12].upper()
    payment = Payment(
        user_id=int(x_user_id) if x_user_id else None,
        amount=payload.amount,
        method=payload.method,
        status="success",
        transaction_id=txn,
    )
    db.add(payment)
    db.commit()
    return CheckoutResponse(status="success", transaction_id=txn, amount=payload.amount)

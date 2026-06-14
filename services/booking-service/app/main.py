import os
import random
import string
import uuid
from typing import List

import httpx
import redis
from fastapi import Depends, FastAPI, Header, HTTPException
from sqlalchemy.orm import Session

from .database import get_db, init_db
from .models import Booking, BookingSeat
from .schemas import BookingOut, ConfirmRequest, HoldRequest, HoldResponse

THEATRE_SERVICE_URL = os.getenv("THEATRE_SERVICE_URL", "http://theatre-service:8004")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
LOCK_TTL = 600  # seconds
CONVENIENCE_FEE_PER_TICKET = 30.0

r = redis.Redis.from_url(REDIS_URL, decode_responses=True)
app = FastAPI(title="Booking Service")


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "booking"}


def current_user_id(x_user_id: str = Header(None)) -> int:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return int(x_user_id)


def _lock_key(showtime_id: int, seat_id: int) -> str:
    return f"seat_lock:{showtime_id}:{seat_id}"


def _fetch_seats(seat_ids: List[int]) -> list:
    if not seat_ids:
        return []
    ids = ",".join(str(s) for s in seat_ids)
    resp = httpx.get(f"{THEATRE_SERVICE_URL}/internal/seats", params={"ids": ids}, timeout=5.0)
    resp.raise_for_status()
    return resp.json()


def _booked_seat_ids(db: Session, showtime_id: int) -> set:
    rows = (
        db.query(BookingSeat.seat_id)
        .filter(BookingSeat.showtime_id == showtime_id, BookingSeat.status == "booked")
        .all()
    )
    return {row[0] for row in rows}


def _gen_ref() -> str:
    return "BMS-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


@app.post("/bookings/hold", response_model=HoldResponse)
def hold_seats(
    payload: HoldRequest,
    user_id: int = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    if not payload.seat_ids:
        raise HTTPException(status_code=400, detail="No seats selected")
    if len(payload.seat_ids) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 seats per booking")

    already_booked = _booked_seat_ids(db, payload.showtime_id)
    conflict = already_booked.intersection(payload.seat_ids)
    if conflict:
        raise HTTPException(status_code=409, detail=f"Seats already booked: {sorted(conflict)}")

    hold_id = str(uuid.uuid4())
    acquired: List[int] = []
    for seat_id in payload.seat_ids:
        ok = r.set(_lock_key(payload.showtime_id, seat_id), hold_id, nx=True, ex=LOCK_TTL)
        if not ok:
            for sid in acquired:
                r.delete(_lock_key(payload.showtime_id, sid))
            raise HTTPException(
                status_code=409, detail=f"Seat {seat_id} is being booked by someone else"
            )
        acquired.append(seat_id)

    seats = _fetch_seats(payload.seat_ids)
    subtotal = sum(s["price"] for s in seats)
    fee = CONVENIENCE_FEE_PER_TICKET * len(payload.seat_ids)
    return HoldResponse(
        hold_id=hold_id,
        showtime_id=payload.showtime_id,
        seat_ids=payload.seat_ids,
        seats=seats,
        subtotal=subtotal,
        convenience_fee=fee,
        expires_in=LOCK_TTL,
    )


@app.post("/bookings/confirm", response_model=BookingOut, status_code=201)
def confirm_booking(
    payload: ConfirmRequest,
    user_id: int = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    if payload.booking_type == "movie":
        if not payload.showtime_id or not payload.seat_ids:
            raise HTTPException(status_code=400, detail="showtime_id and seat_ids required")

        already_booked = _booked_seat_ids(db, payload.showtime_id)
        conflict = already_booked.intersection(payload.seat_ids)
        if conflict:
            raise HTTPException(status_code=409, detail=f"Seats already booked: {sorted(conflict)}")

        seats = _fetch_seats(payload.seat_ids)
        subtotal = sum(s["price"] for s in seats)
        fee = CONVENIENCE_FEE_PER_TICKET * len(payload.seat_ids)
        total = max(0.0, subtotal + fee + payload.addons - payload.discount)

        booking = Booking(
            user_id=user_id,
            booking_type="movie",
            showtime_id=payload.showtime_id,
            title=payload.title,
            venue=payload.venue,
            show_datetime=payload.show_datetime,
            seats=seats,
            quantity=len(payload.seat_ids),
            subtotal=subtotal,
            convenience_fee=fee,
            addons=payload.addons,
            discount=payload.discount,
            total=total,
            status="confirmed",
            booking_ref=_gen_ref(),
        )
        db.add(booking)
        db.flush()
        for seat in seats:
            db.add(
                BookingSeat(
                    booking_id=booking.id,
                    showtime_id=payload.showtime_id,
                    seat_id=seat["id"],
                    status="booked",
                )
            )
        db.commit()
        db.refresh(booking)

        # release Redis holds and decrement availability on the theatre side
        for seat_id in payload.seat_ids:
            r.delete(_lock_key(payload.showtime_id, seat_id))
        try:
            httpx.post(
                f"{THEATRE_SERVICE_URL}/internal/showtimes/{payload.showtime_id}/decrement",
                params={"count": len(payload.seat_ids)},
                timeout=5.0,
            )
        except httpx.HTTPError:
            pass
        return booking

    # event booking (quantity based, no seat map)
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="quantity required for event booking")
    subtotal = payload.unit_price * payload.quantity
    fee = CONVENIENCE_FEE_PER_TICKET * payload.quantity
    total = max(0.0, subtotal + fee + payload.addons - payload.discount)
    booking = Booking(
        user_id=user_id,
        booking_type="event",
        event_id=payload.event_id,
        title=payload.title,
        venue=payload.venue,
        show_datetime=payload.show_datetime,
        seats=[],
        quantity=payload.quantity,
        subtotal=subtotal,
        convenience_fee=fee,
        addons=payload.addons,
        discount=payload.discount,
        total=total,
        status="confirmed",
        booking_ref=_gen_ref(),
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@app.get("/bookings/mine", response_model=List[BookingOut])
def my_bookings(user_id: int = Depends(current_user_id), db: Session = Depends(get_db)):
    return (
        db.query(Booking)
        .filter(Booking.user_id == user_id)
        .order_by(Booking.created_at.desc())
        .all()
    )


@app.get("/bookings/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: int, user_id: int = Depends(current_user_id), db: Session = Depends(get_db)
):
    booking = db.query(Booking).get(booking_id)
    if not booking or booking.user_id != user_id:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@app.delete("/bookings/{booking_id}", response_model=BookingOut)
def cancel_booking(
    booking_id: int, user_id: int = Depends(current_user_id), db: Session = Depends(get_db)
):
    booking = db.query(Booking).get(booking_id)
    if not booking or booking.user_id != user_id:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking already cancelled")

    booking.status = "cancelled"
    if booking.booking_type == "movie" and booking.showtime_id:
        seats = (
            db.query(BookingSeat)
            .filter(BookingSeat.booking_id == booking.id)
            .all()
        )
        for bs in seats:
            bs.status = "cancelled"
        db.commit()
        try:
            httpx.post(
                f"{THEATRE_SERVICE_URL}/internal/showtimes/{booking.showtime_id}/decrement",
                params={"count": -len(seats)},
                timeout=5.0,
            )
        except httpx.HTTPError:
            pass
    else:
        db.commit()
    db.refresh(booking)
    return booking


@app.get("/internal/unavailable/{showtime_id}")
def unavailable(showtime_id: int, db: Session = Depends(get_db)):
    booked = sorted(_booked_seat_ids(db, showtime_id))
    held = []
    pattern = f"seat_lock:{showtime_id}:*"
    for key in r.scan_iter(match=pattern):
        try:
            held.append(int(key.split(":")[-1]))
        except ValueError:
            continue
    return {"booked": booked, "held": held}

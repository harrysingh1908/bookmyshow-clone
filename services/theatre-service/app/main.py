import os
from collections import defaultdict
from datetime import date as date_cls
from typing import List, Optional

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy.orm import Session

from .database import get_db, init_db
from .models import Screen, Seat, Showtime, Theatre
from .schemas import (
    SeatCategory,
    SeatMapOut,
    SeatOut,
    ShowtimeDetail,
    ShowtimeOut,
    TheatreOut,
    TheatreWithShowtimes,
)

BOOKING_SERVICE_URL = os.getenv("BOOKING_SERVICE_URL", "http://booking-service:8005")

app = FastAPI(title="Theatre Service")


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "theatre"}


def _unavailable_seats(showtime_id: int) -> dict:
    """Ask the booking service which seats are booked or temporarily held."""
    try:
        resp = httpx.get(
            f"{BOOKING_SERVICE_URL}/internal/unavailable/{showtime_id}", timeout=3.0
        )
        if resp.status_code == 200:
            return resp.json()
    except httpx.HTTPError:
        pass
    return {"booked": [], "held": []}


@app.get("/theatres", response_model=List[TheatreOut])
def list_theatres(city: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Theatre)
    if city:
        q = q.filter(Theatre.city == city)
    return q.order_by(Theatre.name).all()


@app.get("/movies/{movie_id}/showtimes", response_model=List[TheatreWithShowtimes])
def movie_showtimes(
    movie_id: int,
    city: Optional[str] = None,
    date: Optional[date_cls] = None,
    db: Session = Depends(get_db),
):
    q = (
        db.query(Showtime, Screen, Theatre)
        .join(Screen, Showtime.screen_id == Screen.id)
        .join(Theatre, Screen.theatre_id == Theatre.id)
        .filter(Showtime.movie_id == movie_id)
    )
    if city:
        q = q.filter(Theatre.city == city)
    if date:
        q = q.filter(Showtime.date == date)

    grouped: dict = {}
    order: List[int] = []
    for showtime, screen, theatre in q.order_by(Showtime.start_time).all():
        if theatre.id not in grouped:
            grouped[theatre.id] = {"theatre": theatre, "showtimes": []}
            order.append(theatre.id)
        grouped[theatre.id]["showtimes"].append(
            ShowtimeOut(
                id=showtime.id,
                movie_id=showtime.movie_id,
                date=showtime.date,
                start_time=showtime.start_time,
                available_seats=showtime.available_seats,
                total_seats=showtime.total_seats,
                status=showtime.status,
                format=screen.format,
            )
        )
    return [
        TheatreWithShowtimes(
            theatre=TheatreOut.from_orm(grouped[tid]["theatre"]),
            showtimes=grouped[tid]["showtimes"],
        )
        for tid in order
    ]


@app.get("/showtimes/{showtime_id}", response_model=ShowtimeDetail)
def showtime_detail(showtime_id: int, db: Session = Depends(get_db)):
    row = (
        db.query(Showtime, Screen, Theatre)
        .join(Screen, Showtime.screen_id == Screen.id)
        .join(Theatre, Screen.theatre_id == Theatre.id)
        .filter(Showtime.id == showtime_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Showtime not found")
    showtime, screen, theatre = row
    return ShowtimeDetail(
        id=showtime.id,
        movie_id=showtime.movie_id,
        date=showtime.date,
        start_time=showtime.start_time,
        format=screen.format,
        screen_name=screen.name,
        theatre_id=theatre.id,
        theatre_name=theatre.name,
        theatre_city=theatre.city,
        theatre_address=theatre.address,
    )


@app.get("/showtimes/{showtime_id}/seats", response_model=SeatMapOut)
def seat_map(showtime_id: int, db: Session = Depends(get_db)):
    row = (
        db.query(Showtime, Screen, Theatre)
        .join(Screen, Showtime.screen_id == Screen.id)
        .join(Theatre, Screen.theatre_id == Theatre.id)
        .filter(Showtime.id == showtime_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Showtime not found")
    showtime, screen, theatre = row

    seats = (
        db.query(Seat)
        .filter(Seat.screen_id == screen.id)
        .order_by(Seat.row_label, Seat.col_number)
        .all()
    )

    unavailable = _unavailable_seats(showtime_id)
    booked = set(unavailable.get("booked", []))
    held = set(unavailable.get("held", []))

    seat_out: List[SeatOut] = []
    cats: dict = {}
    for s in seats:
        cats.setdefault(s.category, s.price)
        if s.id in booked:
            status = "booked"
        elif s.id in held:
            status = "held"
        else:
            status = "available"
        seat_out.append(
            SeatOut(
                id=s.id,
                row_label=s.row_label,
                col_number=s.col_number,
                category=s.category,
                price=s.price,
                status=status,
            )
        )

    category_order = ["Recliner", "Gold", "Silver"]
    categories = [
        SeatCategory(name=c, price=cats[c])
        for c in category_order
        if c in cats
    ]

    return SeatMapOut(
        showtime_id=showtime.id,
        movie_id=showtime.movie_id,
        screen_name=screen.name,
        format=screen.format,
        theatre_name=theatre.name,
        rows=screen.rows,
        cols=screen.cols,
        categories=categories,
        seats=seat_out,
    )


@app.get("/internal/seats")
def internal_seats(ids: str, db: Session = Depends(get_db)):
    """Return seat details (price/category/label) for a comma-separated id list."""
    try:
        seat_ids = [int(x) for x in ids.split(",") if x.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid seat ids")
    seats = db.query(Seat).filter(Seat.id.in_(seat_ids)).all()
    return [
        {
            "id": s.id,
            "row_label": s.row_label,
            "col_number": s.col_number,
            "label": f"{s.row_label}{s.col_number}",
            "category": s.category,
            "price": s.price,
            "screen_id": s.screen_id,
        }
        for s in seats
    ]


@app.post("/internal/showtimes/{showtime_id}/decrement")
def decrement_availability(showtime_id: int, count: int, db: Session = Depends(get_db)):
    showtime = db.query(Showtime).get(showtime_id)
    if not showtime:
        raise HTTPException(status_code=404, detail="Showtime not found")
    showtime.available_seats = max(0, showtime.available_seats - count)
    if showtime.available_seats == 0:
        showtime.status = "housefull"
    elif showtime.available_seats < showtime.total_seats * 0.15:
        showtime.status = "almost_full"
    elif showtime.available_seats < showtime.total_seats * 0.5:
        showtime.status = "filling_fast"
    db.commit()
    return {"available_seats": showtime.available_seats, "status": showtime.status}

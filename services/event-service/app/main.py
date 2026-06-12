from datetime import date as date_cls
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

from .database import get_db, init_db
from .models import Event
from .schemas import EventCreate, EventOut

app = FastAPI(title="Event Service")


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "event"}


@app.get("/events/categories")
def categories(db: Session = Depends(get_db)):
    rows = db.query(Event.category).distinct().all()
    return [row[0] for row in rows]


@app.get("/events", response_model=List[EventOut])
def list_events(
    city: Optional[str] = None,
    category: Optional[str] = None,
    date_from: Optional[date_cls] = None,
    date_to: Optional[date_cls] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Event)
    if city:
        q = q.filter(Event.city == city)
    if category:
        q = q.filter(Event.category == category)
    if date_from:
        q = q.filter(Event.date >= date_from)
    if date_to:
        q = q.filter(Event.date <= date_to)
    return q.order_by(Event.date).all()


@app.get("/events/{event_id}", response_model=EventOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@app.post("/events", response_model=EventOut, status_code=201)
def create_event(payload: EventCreate, db: Session = Depends(get_db)):
    event = Event(**payload.dict())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

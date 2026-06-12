import os
from typing import List, Optional

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .database import get_db, init_db
from .models import Review
from .schemas import ReviewCreate, ReviewOut

MOVIE_SERVICE_URL = os.getenv("MOVIE_SERVICE_URL", "http://movie-service:8002")

app = FastAPI(title="Review Service")


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "review"}


def _refresh_movie_rating(db: Session, movie_id: int) -> None:
    avg, count = (
        db.query(func.avg(Review.rating), func.count(Review.id))
        .filter(Review.movie_id == movie_id)
        .first()
    )
    avg = float(avg or 0.0)
    count = int(count or 0)
    try:
        httpx.post(
            f"{MOVIE_SERVICE_URL}/internal/rating/{movie_id}",
            params={"avg_rating": avg, "vote_count": count},
            timeout=5.0,
        )
    except httpx.HTTPError:
        pass


@app.get("/movies/{movie_id}/reviews", response_model=List[ReviewOut])
def list_reviews(movie_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Review)
        .filter(Review.movie_id == movie_id)
        .order_by(Review.created_at.desc())
        .all()
    )


@app.post("/movies/{movie_id}/reviews", response_model=ReviewOut, status_code=201)
def create_review(
    movie_id: int,
    payload: ReviewCreate,
    x_user_id: Optional[str] = Header(None),
    x_user_name: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    review = Review(
        movie_id=movie_id,
        user_id=int(x_user_id),
        author_name=x_user_name or "Anonymous",
        rating=payload.rating,
        title=payload.title,
        body=payload.body,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    _refresh_movie_rating(db, movie_id)
    return review

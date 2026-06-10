from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy.orm import Session

from .database import get_db, init_db
from .models import Movie
from .schemas import MovieCreate, MovieOut

app = FastAPI(title="Movie Service")


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "movie"}


@app.get("/movies", response_model=List[MovieOut])
def list_movies(
    lang: Optional[str] = None,
    genre: Optional[str] = None,
    format: Optional[str] = None,
    sort: str = Query("popularity", pattern="^(popularity|rating|release)$"),
    db: Session = Depends(get_db),
):
    q = db.query(Movie).filter(Movie.is_upcoming.is_(False))
    if lang:
        q = q.filter(Movie.languages.any(lang))
    if genre:
        q = q.filter(Movie.genres.any(genre))
    if format:
        q = q.filter(Movie.formats.any(format))

    if sort == "rating":
        q = q.order_by(Movie.avg_rating.desc())
    elif sort == "release":
        q = q.order_by(Movie.release_date.desc().nullslast())
    else:
        q = q.order_by(Movie.vote_count.desc())
    return q.all()


@app.get("/movies/upcoming", response_model=List[MovieOut])
def upcoming(db: Session = Depends(get_db)):
    return (
        db.query(Movie)
        .filter(Movie.is_upcoming.is_(True))
        .order_by(Movie.release_date.asc().nullslast())
        .all()
    )


@app.get("/movies/{movie_id}", response_model=MovieOut)
def get_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).get(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie


@app.post("/movies", response_model=MovieOut, status_code=201)
def create_movie(payload: MovieCreate, db: Session = Depends(get_db)):
    movie = Movie(**payload.dict())
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return movie


@app.get("/internal/rating/{movie_id}")
def get_rating(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).get(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return {"avg_rating": movie.avg_rating, "vote_count": movie.vote_count}


@app.post("/internal/rating/{movie_id}")
def set_rating(movie_id: int, avg_rating: float, vote_count: int, db: Session = Depends(get_db)):
    """Called by the review service to keep the denormalized rating fresh."""
    movie = db.query(Movie).get(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    movie.avg_rating = round(avg_rating, 1)
    movie.vote_count = vote_count
    db.commit()
    return {"status": "updated"}

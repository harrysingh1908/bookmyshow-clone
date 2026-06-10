from datetime import date
from typing import Any, List, Optional

from pydantic import BaseModel


class MovieBase(BaseModel):
    title: str
    description: str = ""
    duration_mins: int = 120
    languages: List[str] = []
    genres: List[str] = []
    formats: List[str] = []
    certificate: str = "UA"
    release_date: Optional[date] = None
    poster_url: Optional[str] = None
    banner_url: Optional[str] = None
    trailer_url: Optional[str] = None
    cast: List[Any] = []
    avg_rating: float = 0.0
    vote_count: int = 0
    is_upcoming: bool = False


class MovieCreate(MovieBase):
    pass


class MovieOut(MovieBase):
    id: int

    class Config:
        from_attributes = True

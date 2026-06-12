from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: str = ""
    body: str = ""


class ReviewOut(BaseModel):
    id: int
    movie_id: int
    user_id: int
    author_name: str
    rating: int
    title: str
    body: str
    created_at: datetime

    class Config:
        from_attributes = True

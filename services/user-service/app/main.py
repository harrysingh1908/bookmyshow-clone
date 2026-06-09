from fastapi import Depends, FastAPI, Header, HTTPException
from jose import JWTError
from sqlalchemy.orm import Session

from .database import get_db, init_db
from .models import User
from .schemas import (
    PasswordChange,
    TokenResponse,
    UserLogin,
    UserOut,
    UserRegister,
    UserUpdate,
)
from .security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)

app = FastAPI(title="User Service")


@app.on_event("startup")
def startup() -> None:
    init_db()


def current_user(
    authorization: str = Header(None), db: Session = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "user"}


@app.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        phone=payload.phone,
        city=payload.city,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=UserOut.from_orm(user))


@app.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=UserOut.from_orm(user))


@app.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return UserOut.from_orm(user)


@app.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return UserOut.from_orm(user)


@app.post("/me/password")
def change_password(
    payload: PasswordChange,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"status": "password updated"}

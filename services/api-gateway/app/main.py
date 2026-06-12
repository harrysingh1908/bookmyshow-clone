import os

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt

JWT_SECRET = os.getenv("JWT_SECRET", "dev_secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

USER = os.getenv("USER_SERVICE_URL", "http://user-service:8001")
MOVIE = os.getenv("MOVIE_SERVICE_URL", "http://movie-service:8002")
EVENT = os.getenv("EVENT_SERVICE_URL", "http://event-service:8003")
THEATRE = os.getenv("THEATRE_SERVICE_URL", "http://theatre-service:8004")
BOOKING = os.getenv("BOOKING_SERVICE_URL", "http://booking-service:8005")
PAYMENT = os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8006")
REVIEW = os.getenv("REVIEW_SERVICE_URL", "http://review-service:8007")

app = FastAPI(title="BookMyShow API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = httpx.AsyncClient(timeout=15.0)


@app.on_event("shutdown")
async def shutdown() -> None:
    await client.aclose()


def _auth_headers(request: Request) -> dict:
    """Validate the bearer token and return identity headers for downstream services."""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(auth.split(" ", 1)[1], JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {
        "X-User-Id": str(payload.get("sub", "")),
        "X-User-Name": payload.get("name", ""),
        "X-User-Email": payload.get("email", ""),
    }


async def proxy(request: Request, target: str, require_auth: bool = False) -> Response:
    headers = {}
    if "content-type" in request.headers:
        headers["content-type"] = request.headers["content-type"]
    if require_auth:
        headers.update(_auth_headers(request))

    body = await request.body()
    try:
        upstream = await client.request(
            request.method,
            target,
            params=dict(request.query_params),
            content=body,
            headers=headers,
        )
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Upstream service unavailable")

    media = upstream.headers.get("content-type", "application/json")
    return Response(content=upstream.content, status_code=upstream.status_code, media_type=media)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "gateway"}


# ---- Auth ----
@app.post("/api/auth/register")
async def register(request: Request):
    return await proxy(request, f"{USER}/register")


@app.post("/api/auth/login")
async def login(request: Request):
    return await proxy(request, f"{USER}/login")


@app.api_route("/api/auth/me", methods=["GET", "PATCH"])
async def me(request: Request):
    return await proxy(request, f"{USER}/me", require_auth=True)


@app.post("/api/auth/me/password")
async def change_password(request: Request):
    return await proxy(request, f"{USER}/me/password", require_auth=True)


# ---- Movies ----
@app.get("/api/movies")
async def movies(request: Request):
    return await proxy(request, f"{MOVIE}/movies")


@app.get("/api/movies/upcoming")
async def movies_upcoming(request: Request):
    return await proxy(request, f"{MOVIE}/movies/upcoming")


@app.get("/api/movies/{movie_id}")
async def movie_detail(movie_id: int, request: Request):
    return await proxy(request, f"{MOVIE}/movies/{movie_id}")


@app.get("/api/movies/{movie_id}/showtimes")
async def movie_showtimes(movie_id: int, request: Request):
    return await proxy(request, f"{THEATRE}/movies/{movie_id}/showtimes")


@app.get("/api/movies/{movie_id}/reviews")
async def movie_reviews(movie_id: int, request: Request):
    return await proxy(request, f"{REVIEW}/movies/{movie_id}/reviews")


@app.post("/api/movies/{movie_id}/reviews")
async def post_review(movie_id: int, request: Request):
    return await proxy(request, f"{REVIEW}/movies/{movie_id}/reviews", require_auth=True)


# ---- Showtimes / Theatres ----
@app.get("/api/showtimes/{showtime_id}")
async def showtime(showtime_id: int, request: Request):
    return await proxy(request, f"{THEATRE}/showtimes/{showtime_id}")


@app.get("/api/showtimes/{showtime_id}/seats")
async def showtime_seats(showtime_id: int, request: Request):
    return await proxy(request, f"{THEATRE}/showtimes/{showtime_id}/seats")


@app.get("/api/theatres")
async def theatres(request: Request):
    return await proxy(request, f"{THEATRE}/theatres")


# ---- Events ----
@app.get("/api/events/categories")
async def event_categories(request: Request):
    return await proxy(request, f"{EVENT}/events/categories")


@app.get("/api/events")
async def events(request: Request):
    return await proxy(request, f"{EVENT}/events")


@app.get("/api/events/{event_id}")
async def event_detail(event_id: int, request: Request):
    return await proxy(request, f"{EVENT}/events/{event_id}")


# ---- Bookings ----
@app.post("/api/bookings/hold")
async def booking_hold(request: Request):
    return await proxy(request, f"{BOOKING}/bookings/hold", require_auth=True)


@app.post("/api/bookings/confirm")
async def booking_confirm(request: Request):
    return await proxy(request, f"{BOOKING}/bookings/confirm", require_auth=True)


@app.get("/api/bookings/mine")
async def booking_mine(request: Request):
    return await proxy(request, f"{BOOKING}/bookings/mine", require_auth=True)


@app.get("/api/bookings/{booking_id}")
async def booking_detail(booking_id: int, request: Request):
    return await proxy(request, f"{BOOKING}/bookings/{booking_id}", require_auth=True)


@app.delete("/api/bookings/{booking_id}")
async def booking_cancel(booking_id: int, request: Request):
    return await proxy(request, f"{BOOKING}/bookings/{booking_id}", require_auth=True)


# ---- Payments ----
@app.post("/api/payments/checkout")
async def payments_checkout(request: Request):
    return await proxy(request, f"{PAYMENT}/payments/checkout", require_auth=True)


@app.post("/api/payments/validate-promo")
async def validate_promo(request: Request):
    return await proxy(request, f"{PAYMENT}/payments/validate-promo")


@app.get("/api/payments/offers")
async def offers(request: Request):
    return await proxy(request, f"{PAYMENT}/payments/offers")


# ---- Search (aggregates movies + events) ----
@app.get("/api/search")
async def search(q: str = ""):
    q_lower = q.strip().lower()
    result = {"movies": [], "events": []}
    if not q_lower:
        return result
    try:
        m = await client.get(f"{MOVIE}/movies")
        if m.status_code == 200:
            result["movies"] = [
                mv for mv in m.json() if q_lower in mv["title"].lower()
            ][:10]
        e = await client.get(f"{EVENT}/events")
        if e.status_code == 200:
            result["events"] = [
                ev for ev in e.json() if q_lower in ev["title"].lower()
            ][:10]
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Search upstream unavailable")
    return result

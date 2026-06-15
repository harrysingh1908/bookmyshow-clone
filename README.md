# BookMyShow Clone

A full-stack, microservice-based clone of BookMyShow. Browse movies and live
events, read & write reviews, pick seats on an interactive seat map with real
seat-locking, apply promo codes, add food & beverages, and book tickets with a
QR-coded confirmation.

Everything runs with a single `docker compose up`.

![stack](https://img.shields.io/badge/backend-FastAPI-009688) ![stack](https://img.shields.io/badge/frontend-React%20%2B%20TS-61DAFB) ![stack](https://img.shields.io/badge/db-PostgreSQL%20%2B%20Redis-336791)

## Features

- **Movies** — catalog with language / genre / format filters and sorting, rich
  detail pages (about, trailer, cast, reviews).
- **Showtimes** — 7-day date strip, theatres grouped by multiplex chain, show
  times colour-coded by availability (available / filling fast / almost full /
  housefull).
- **Interactive seat map** — Recliner / Gold / Silver tiers, live booked & held
  seat status, 10-seat limit, legend, sticky summary bar.
- **Seat locking** — selecting and proceeding places a short-lived Redis lock so
  two users can't grab the same seat.
- **Checkout** — food & beverage add-ons, promo-code validation, price breakdown,
  mock payment gateway.
- **Confirmation** — QR-coded ticket with full booking details, printable.
- **Events** — music, comedy, sports, theatre, kids & workshops with category
  filtering, detail pages with venue map and quantity-based booking.
- **Auth** — JWT email/password register & login, protected routes.
- **Profile** — booking history with cancellation, profile editing, password
  change, and active offers.
- **Search** — debounced global search across movies and events.

## Architecture

```
            React SPA (:3000, nginx)
                     │
                     ▼
            API Gateway (:8000)         ← CORS + JWT validation, forwards identity
   ┌────────┬────────┬───────┬─────────┼─────────┬─────────┬─────────┐
   ▼        ▼        ▼       ▼         ▼         ▼         ▼
 user     movie    event  theatre   booking   payment   review
 :8001    :8002    :8003  :8004     :8005     :8006     :8007
   └────────┴────────┴───────┴─────────┴─────────┴─────────┘
                     │
          PostgreSQL (:5432, schema per service) + Redis (:6379)
```

Each service owns its own Postgres schema and never touches another service's
tables; cross-domain data flows over HTTP. See [docs/architecture.md](docs/architecture.md).

| Service  | Port | Responsibility                                  |
|----------|------|-------------------------------------------------|
| gateway  | 8000 | Single entry point, CORS, JWT, search aggregation |
| user     | 8001 | Accounts, auth, JWT issuance                    |
| movie    | 8002 | Movie catalog & ratings                         |
| event    | 8003 | Live events                                     |
| theatre  | 8004 | Theatres, screens, seats, showtimes, seat maps  |
| booking  | 8005 | Seat holds (Redis), bookings, cancellations     |
| payment  | 8006 | Mock checkout, promo codes                      |
| review   | 8007 | Movie reviews                                   |

## Tech stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy 2, psycopg2
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, Axios
- **Data:** PostgreSQL 15, Redis 7
- **Auth:** JWT (python-jose), bcrypt (passlib)
- **Infra:** Docker Compose, nginx (frontend)

## Running locally

Requires Docker & Docker Compose.

```bash
cp .env.example .env
docker compose up --build
```

Open **http://localhost:3000**.

On first boot the `seed` container waits for the services to create their tables,
then populates the database with 16 movies, 15 theatres across 5 cities (with
full seat maps and a week of showtimes), 50 events, and 6 promo codes. It is
idempotent — re-running does nothing if data already exists.

### Try it

1. Create an account (top-right **Sign In → Create an account**).
2. Pick a movie → **Book tickets** → choose a date & show.
3. Select seats → **Proceed** → add F&B / apply a promo (e.g. `BMS10`).
4. **Pay** → get your QR-coded ticket. Find it again under **Profile → Bookings**.

### Sample promo codes

`BMS10`, `FIRST50`, `BLOCKBUSTER`, `WEEKEND20`, `FOODIE`, `PAYDAY`

## API

All routes are exposed through the gateway under `/api`. A few examples:

```
POST /api/auth/register            POST /api/bookings/hold       (auth)
POST /api/auth/login               POST /api/bookings/confirm    (auth)
GET  /api/movies?genre=Action      GET  /api/bookings/mine       (auth)
GET  /api/movies/{id}/showtimes    POST /api/payments/validate-promo
GET  /api/showtimes/{id}/seats     GET  /api/events?city=Mumbai
POST /api/movies/{id}/reviews      GET  /api/search?q=...
```

Interactive docs for any service are available at `http://localhost:<port>/docs`.

## Project layout

```
bms-clone/
├── docker-compose.yml
├── services/            # 8 FastAPI microservices (one folder each)
├── frontend/            # React + Vite + Tailwind SPA
├── scripts/seed_db.py   # database seeder
└── docs/architecture.md
```

## Notes

This is a learning/portfolio project and is not affiliated with BookMyShow.
The payment gateway is mocked — no real transactions occur.

# BookMyShow Clone

A full-stack, microservice-based clone of BookMyShow. Browse movies & events,
pick seats on an interactive seat map, apply promo codes, and book tickets.

## Stack

- **Backend:** Python 3.11 + FastAPI (8 services)
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Database:** PostgreSQL 15 (schema-per-service) + Redis 7 (caching + seat locking)
- **Auth:** JWT (email + password)
- **Infra:** Docker Compose

## Architecture

```
React (3000)  ->  API Gateway (8000)  ->  7 microservices  ->  Postgres + Redis
```

Services: user (8001), movie (8002), event (8003), theatre (8004),
booking (8005), payment (8006), review (8007).

## Running locally

```bash
cp .env.example .env
docker compose up --build
```

Then open http://localhost:3000

The `seed` container populates the database with movies, theatres, showtimes,
seats, events and promo codes on first boot.

## Status

Work in progress.

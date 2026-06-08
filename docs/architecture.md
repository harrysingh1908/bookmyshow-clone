# Architecture Notes

## Service boundaries

Each domain is its own FastAPI service with its own Postgres schema. Services
do not share tables; cross-domain reads happen over HTTP through the gateway or
direct service-to-service calls (booking -> theatre for seat data).

| Service  | Port | Schema    | Owns                                  |
|----------|------|-----------|---------------------------------------|
| user     | 8001 | users     | accounts, auth, JWT                   |
| movie    | 8002 | movies    | movie catalog                         |
| event    | 8003 | events    | non-movie events (music/comedy/sport) |
| theatre  | 8004 | theatres  | theatres, screens, seats, showtimes   |
| booking  | 8005 | bookings  | bookings, seat holds (Redis)          |
| payment  | 8006 | payments  | mock payments, promo codes            |
| review   | 8007 | reviews   | movie reviews                         |

## Seat locking

When a user reaches the seat picker and proceeds, the booking service places a
short-lived Redis lock (`seat_lock:{showtime_id}:{seat_id}`, TTL 600s). Locks
are released on confirmation (seats marked booked) or on expiry.

## Why one Postgres instance, many schemas

Keeps the local dev footprint small while preserving logical isolation. In
production each schema could be promoted to its own database without code
changes (every service reads its own `DATABASE_URL`).

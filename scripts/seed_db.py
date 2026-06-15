"""Seed the BookMyShow clone database with realistic demo data.

Connects directly to Postgres and inserts into the schemas owned by each
service (movies / theatres / events / payments). Idempotent: if movies are
already present it exits without touching anything.
"""
import json
import os
import random
import time
from datetime import date, datetime, time as dtime, timedelta

import psycopg2
from psycopg2.extras import Json

DB_URL = os.getenv("DATABASE_URL", "postgresql://bms:bms_secret@localhost:5432/bms")
# psycopg2 wants a plain postgres URL, strip the SQLAlchemy driver suffix
DB_URL = DB_URL.replace("postgresql+psycopg2://", "postgresql://")

CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai"]
CHAINS = ["PVR Cinemas", "INOX", "Cinepolis", "Carnival Cinemas"]
AMENITIES = ["M-Ticket", "Food & Beverage", "Dolby Atmos", "Recliner", "Wheelchair"]
SHOW_TIMES = [dtime(10, 0), dtime(13, 30), dtime(17, 0), dtime(20, 30)]

POSTER = "https://picsum.photos/seed/{seed}/400/600"
BANNER = "https://picsum.photos/seed/{seed}-b/1280/520"
TRAILER = "https://www.youtube.com/embed/dQw4w9WgXcQ"


def poster(seed):
    return POSTER.format(seed=seed)


def banner(seed):
    return BANNER.format(seed=seed)


def cast(*names):
    roles = ["Lead", "Lead", "Supporting", "Supporting", "Director"]
    return [
        {"name": n, "role": roles[i % len(roles)], "photo": poster(f"cast-{n}")}
        for i, n in enumerate(names)
    ]


MOVIES = [
    {"title": "Neon Horizon", "genres": ["Sci-Fi", "Action"], "languages": ["English", "Hindi"],
     "formats": ["2D", "3D", "IMAX"], "certificate": "UA", "duration": 148, "rating": 8.7, "votes": 24500,
     "desc": "In a near-future megacity, a rogue engineer uncovers a conspiracy that could rewrite reality itself.",
     "cast_names": ["Arjun Mehra", "Sara Khan", "Vikram Rao", "Neha Joshi", "Imtiaz Ali"]},
    {"title": "Monsoon Melodies", "genres": ["Romance", "Musical"], "languages": ["Hindi"],
     "formats": ["2D"], "certificate": "U", "duration": 132, "rating": 7.9, "votes": 12300,
     "desc": "Two musicians from different worlds fall in love over one unforgettable Mumbai monsoon.",
     "cast_names": ["Ranveer Singh", "Alia Sharma", "Boman Patel", "Zoya Akhtar"]},
    {"title": "The Last Heist", "genres": ["Thriller", "Crime"], "languages": ["English"],
     "formats": ["2D", "IMAX"], "certificate": "A", "duration": 121, "rating": 8.2, "votes": 18900,
     "desc": "A master thief assembles one final crew for the impossible robbery of a lifetime.",
     "cast_names": ["Daniel Cross", "Emma Stone", "Marcus Lee", "Nolan Reed"]},
    {"title": "Chai & Chaos", "genres": ["Comedy", "Drama"], "languages": ["Hindi", "Marathi"],
     "formats": ["2D"], "certificate": "UA", "duration": 118, "rating": 7.4, "votes": 8600,
     "desc": "A chaotic family reunion at a Pune tea stall spirals into comedic mayhem.",
     "cast_names": ["Pankaj Tripathi", "Radhika Apte", "Kunal Roy"]},
    {"title": "Shadow Protocol", "genres": ["Action", "Spy"], "languages": ["English", "Hindi", "Tamil"],
     "formats": ["2D", "3D", "IMAX", "4DX"], "certificate": "UA", "duration": 156, "rating": 8.5, "votes": 31200,
     "desc": "An elite agent goes off-grid to stop a global cyber-terror attack.",
     "cast_names": ["Hrithik Verma", "Deepika Nair", "Tom Hardy", "Priya Das"]},
    {"title": "Silent River", "genres": ["Drama"], "languages": ["Malayalam", "Hindi"],
     "formats": ["2D"], "certificate": "U", "duration": 109, "rating": 8.0, "votes": 5400,
     "desc": "A quiet fisherman's life changes when a stranger arrives in his coastal village.",
     "cast_names": ["Fahadh Faasil", "Nimisha Sajayan", "Sobhita D"]},
    {"title": "Galaxy Raiders", "genres": ["Sci-Fi", "Adventure"], "languages": ["English", "Telugu"],
     "formats": ["3D", "IMAX"], "certificate": "UA", "duration": 142, "rating": 7.6, "votes": 14700,
     "desc": "A ragtag space crew races to find a lost artifact before an empire does.",
     "cast_names": ["Chris Park", "Anushka Reddy", "Jude Law", "Mahesh K"]},
    {"title": "Mumbai Nights", "genres": ["Crime", "Drama"], "languages": ["Hindi"],
     "formats": ["2D"], "certificate": "A", "duration": 138, "rating": 8.3, "votes": 20100,
     "desc": "A rookie cop navigates the underbelly of the city across a single sleepless night.",
     "cast_names": ["Nawazuddin S", "Tabu Rai", "Manoj B"]},
    {"title": "The Comedy Club", "genres": ["Comedy"], "languages": ["English", "Hindi"],
     "formats": ["2D"], "certificate": "UA", "duration": 96, "rating": 7.1, "votes": 6200,
     "desc": "Five struggling stand-up comics chase one big break at a legendary club.",
     "cast_names": ["Vir D", "Mallika Dua", "Kenny S"]},
    {"title": "Warrior Queen", "genres": ["Historical", "Action"], "languages": ["Hindi", "Tamil", "Telugu"],
     "formats": ["2D", "3D", "IMAX"], "certificate": "UA", "duration": 164, "rating": 8.6, "votes": 28800,
     "desc": "The untold story of a fearless queen who defended her kingdom against an empire.",
     "cast_names": ["Kangana R", "Prabhas Y", "Sonu S", "Anil K"]},
    {"title": "Code Red", "genres": ["Thriller", "Tech"], "languages": ["English"],
     "formats": ["2D", "IMAX"], "certificate": "A", "duration": 124, "rating": 7.8, "votes": 9900,
     "desc": "A whistleblower hacker must outrun the very agency she once worked for.",
     "cast_names": ["Rooney M", "Oscar I", "Lily C"]},
    {"title": "Festival of Lights", "genres": ["Family", "Drama"], "languages": ["Hindi", "Gujarati"],
     "formats": ["2D"], "certificate": "U", "duration": 127, "rating": 7.5, "votes": 7300,
     "desc": "Three generations of a family come together for one extraordinary Diwali.",
     "cast_names": ["Ratna P", "Paresh R", "Sanya M"]},
]

UPCOMING = [
    {"title": "Eclipse 2099", "genres": ["Sci-Fi"], "languages": ["English", "Hindi"],
     "formats": ["3D", "IMAX"], "certificate": "UA", "duration": 150, "rating": 0, "votes": 0,
     "desc": "When the sun goes dark, humanity's last colony fights to survive.",
     "cast_names": ["Tom Hardy", "Deepika Nair"], "release_in": 9},
    {"title": "The Wedding Heist", "genres": ["Comedy", "Crime"], "languages": ["Hindi"],
     "formats": ["2D"], "certificate": "UA", "duration": 122, "rating": 0, "votes": 0,
     "desc": "A big fat Indian wedding becomes the perfect cover for a daring heist.",
     "cast_names": ["Ayushmann K", "Bhumi P"], "release_in": 14},
    {"title": "Tiger Trail", "genres": ["Adventure", "Drama"], "languages": ["Hindi", "English"],
     "formats": ["2D", "IMAX"], "certificate": "U", "duration": 118, "rating": 0, "votes": 0,
     "desc": "A wildlife photographer treks deep into the jungle to find a legendary tiger.",
     "cast_names": ["Randeep H", "Vidya B"], "release_in": 21},
    {"title": "Midnight Express", "genres": ["Thriller"], "languages": ["English"],
     "formats": ["2D"], "certificate": "A", "duration": 109, "rating": 0, "votes": 0,
     "desc": "A overnight train journey turns deadly when a passenger goes missing.",
     "cast_names": ["Jake G", "Florence P"], "release_in": 28},
]

EVENTS = [
    {"title": "Arijit Singh Live in Concert", "category": "Music", "price": (1500, 8000),
     "venue": "DY Patil Stadium", "artists": ["Arijit Singh"],
     "desc": "An unforgettable evening with the voice of a generation, performing his greatest hits live."},
    {"title": "Zakir Khan: Tathastu", "category": "Comedy", "price": (799, 2499),
     "venue": "Jamshed Bhabha Theatre", "artists": ["Zakir Khan"],
     "desc": "India's beloved storyteller returns with an all-new stand-up special."},
    {"title": "IPL: Mumbai vs Chennai", "category": "Sports", "price": (900, 12000),
     "venue": "Wankhede Stadium", "artists": [],
     "desc": "The biggest rivalry in Indian cricket, live under the lights."},
    {"title": "Mughal-e-Azam: The Musical", "category": "Theatre & Arts", "price": (1000, 5000),
     "venue": "NCPA", "artists": ["Feroz Abbas Khan"],
     "desc": "A grand Broadway-style theatrical staging of the timeless classic."},
    {"title": "Sunburn Arena ft. Martin Garrix", "category": "Music", "price": (2500, 15000),
     "venue": "Mahalaxmi Race Course", "artists": ["Martin Garrix"],
     "desc": "Asia's biggest EDM experience returns with a world-class headliner."},
    {"title": "Kenny Sebastian: Standing Up", "category": "Comedy", "price": (699, 1999),
     "venue": "St. Andrews Auditorium", "artists": ["Kenny Sebastian"],
     "desc": "Observational comedy at its finest from one of India's sharpest comics."},
    {"title": "The Pro Kabaddi Finals", "category": "Sports", "price": (500, 6000),
     "venue": "Gachibowli Indoor Stadium", "artists": [],
     "desc": "Witness the high-octane finale of the season live."},
    {"title": "Coke Studio Live", "category": "Music", "price": (1200, 6500),
     "venue": "Phoenix Marketcity", "artists": ["Various Artists"],
     "desc": "A fusion of folk, classical and contemporary sounds on one stage."},
    {"title": "Kids Magic Carnival", "category": "Kids", "price": (300, 900),
     "venue": "Phoenix Palladium", "artists": ["Magician Sammy"],
     "desc": "A day of magic, games and wonder for the whole family."},
    {"title": "Pottery & Mindfulness Workshop", "category": "Workshops", "price": (1200, 1200),
     "venue": "The Creative Studio", "artists": [],
     "desc": "Unwind and create with a hands-on guided pottery session."},
]

PROMOS = [
    {"code": "BMS10", "description": "10% off up to ₹100", "type": "pct", "value": 10,
     "min": 200, "cap": 100, "uses": 10000},
    {"code": "FIRST50", "description": "Flat ₹50 off your first booking", "type": "flat", "value": 50,
     "min": 250, "cap": 0, "uses": 10000},
    {"code": "BLOCKBUSTER", "description": "Flat ₹150 off on orders above ₹1000", "type": "flat", "value": 150,
     "min": 1000, "cap": 0, "uses": 5000},
    {"code": "WEEKEND20", "description": "20% off up to ₹250", "type": "pct", "value": 20,
     "min": 500, "cap": 250, "uses": 8000},
    {"code": "FOODIE", "description": "Flat ₹75 off with F&B", "type": "flat", "value": 75,
     "min": 400, "cap": 0, "uses": 6000},
    {"code": "PAYDAY", "description": "15% off up to ₹200", "type": "pct", "value": 15,
     "min": 600, "cap": 200, "uses": 7000},
]


def connect():
    for attempt in range(30):
        try:
            conn = psycopg2.connect(DB_URL)
            conn.autocommit = False
            return conn
        except psycopg2.OperationalError:
            print(f"[seed] waiting for postgres... ({attempt + 1})")
            time.sleep(2)
    raise SystemExit("[seed] could not connect to postgres")


def wait_for_tables(conn, tables):
    for fq in tables:
        for attempt in range(60):
            with conn.cursor() as cur:
                cur.execute("SELECT to_regclass(%s)", (fq,))
                if cur.fetchone()[0] is not None:
                    break
            conn.rollback()
            print(f"[seed] waiting for table {fq}... ({attempt + 1})")
            time.sleep(2)
        else:
            raise SystemExit(f"[seed] table {fq} never appeared")


def already_seeded(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM movies.movies")
        return cur.fetchone()[0] > 0


def seed_movies(conn):
    ids = []
    with conn.cursor() as cur:
        for i, m in enumerate(MOVIES):
            cur.execute(
                """INSERT INTO movies.movies
                   (title, description, duration_mins, languages, genres, formats,
                    certificate, release_date, poster_url, banner_url, trailer_url,
                    "cast", avg_rating, vote_count, is_upcoming)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,false)
                   RETURNING id""",
                (m["title"], m["desc"], m["duration"], m["languages"], m["genres"],
                 m["formats"], m["certificate"], date.today() - timedelta(days=random.randint(3, 40)),
                 poster(f"movie-{i}"), banner(f"movie-{i}"), TRAILER,
                 Json(cast(*m["cast_names"])), m["rating"], m["votes"]),
            )
            ids.append(cur.fetchone()[0])
        for i, m in enumerate(UPCOMING):
            cur.execute(
                """INSERT INTO movies.movies
                   (title, description, duration_mins, languages, genres, formats,
                    certificate, release_date, poster_url, banner_url, trailer_url,
                    "cast", avg_rating, vote_count, is_upcoming)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,0,0,true)""",
                (m["title"], m["desc"], m["duration"], m["languages"], m["genres"],
                 m["formats"], m["certificate"], date.today() + timedelta(days=m["release_in"]),
                 poster(f"up-{i}"), banner(f"up-{i}"), TRAILER,
                 Json(cast(*m["cast_names"]))),
            )
    print(f"[seed] inserted {len(ids)} now-showing + {len(UPCOMING)} upcoming movies")
    return ids


def seed_theatres_and_shows(conn, movie_ids):
    n_shows = 0
    formats = ["2D", "3D", "IMAX", "4DX"]
    with conn.cursor() as cur:
        for city in CITIES:
            for t in range(3):
                chain = CHAINS[(t) % len(CHAINS)]
                cur.execute(
                    """INSERT INTO theatres.theatres (name, chain, city, address, amenities)
                       VALUES (%s,%s,%s,%s,%s) RETURNING id""",
                    (f"{chain}: {city} Mall {t + 1}", chain, city,
                     f"Level {t + 2}, {city} Central Mall, {city}",
                     random.sample(AMENITIES, k=random.randint(3, 5))),
                )
                theatre_id = cur.fetchone()[0]
                for s in range(2):
                    fmt = formats[(t + s) % len(formats)]
                    rows, cols = 8, 12
                    cur.execute(
                        """INSERT INTO theatres.screens (theatre_id, name, format, rows, cols)
                           VALUES (%s,%s,%s,%s,%s) RETURNING id""",
                        (theatre_id, f"Audi {s + 1}", fmt, rows, cols),
                    )
                    screen_id = cur.fetchone()[0]
                    # seats: A-C silver, D-F gold, G-H recliner
                    for r in range(rows):
                        row_label = chr(ord("A") + r)
                        if row_label in ("A", "B", "C"):
                            cat, price = "Silver", 200.0
                        elif row_label in ("D", "E", "F"):
                            cat, price = "Gold", 300.0
                        else:
                            cat, price = "Recliner", 500.0
                        for c in range(1, cols + 1):
                            cur.execute(
                                """INSERT INTO theatres.seats
                                   (screen_id, row_label, col_number, category, price)
                                   VALUES (%s,%s,%s,%s,%s)""",
                                (screen_id, row_label, c, cat, price),
                            )
                    total = rows * cols
                    # showtimes for the next 7 days
                    for d in range(7):
                        show_date = date.today() + timedelta(days=d)
                        for slot, stime in enumerate(SHOW_TIMES):
                            movie_id = movie_ids[(t + s + slot + d) % len(movie_ids)]
                            available = random.randint(int(total * 0.15), total)
                            if available == 0:
                                status = "housefull"
                            elif available < total * 0.15:
                                status = "almost_full"
                            elif available < total * 0.5:
                                status = "filling_fast"
                            else:
                                status = "available"
                            cur.execute(
                                """INSERT INTO theatres.showtimes
                                   (screen_id, movie_id, date, start_time,
                                    available_seats, total_seats, status)
                                   VALUES (%s,%s,%s,%s,%s,%s,%s)""",
                                (screen_id, movie_id, show_date, stime,
                                 available, total, status),
                            )
                            n_shows += 1
    print(f"[seed] inserted {len(CITIES) * 3} theatres and {n_shows} showtimes")


def seed_events(conn):
    n = 0
    with conn.cursor() as cur:
        for city in CITIES:
            for i, e in enumerate(EVENTS):
                total = random.randint(500, 5000)
                cur.execute(
                    """INSERT INTO events.events
                       (title, description, category, city, venue_name, venue_address,
                        date, start_time, end_time, image_url, artists,
                        price_from, price_to, available_tickets, total_tickets)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (e["title"], e["desc"], e["category"], city, e["venue"],
                     f"{e['venue']}, {city}",
                     date.today() + timedelta(days=random.randint(2, 40)),
                     dtime(19, 0), dtime(22, 0), banner(f"event-{i}-{city}"),
                     Json(e["artists"]), e["price"][0], e["price"][1],
                     random.randint(50, total), total),
                )
                n += 1
    print(f"[seed] inserted {n} events")


def seed_promos(conn):
    with conn.cursor() as cur:
        for p in PROMOS:
            cur.execute(
                """INSERT INTO payments.promo_codes
                   (code, description, discount_type, discount_value, min_amount,
                    max_discount, max_uses, used_count)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,0)
                   ON CONFLICT (code) DO NOTHING""",
                (p["code"], p["description"], p["type"], p["value"],
                 p["min"], p["cap"], p["uses"]),
            )
    print(f"[seed] inserted {len(PROMOS)} promo codes")


def main():
    random.seed(42)
    conn = connect()
    wait_for_tables(conn, [
        "movies.movies",
        "theatres.theatres",
        "theatres.screens",
        "theatres.seats",
        "theatres.showtimes",
        "events.events",
        "payments.promo_codes",
    ])
    if already_seeded(conn):
        print("[seed] database already seeded, skipping")
        return
    movie_ids = seed_movies(conn)
    seed_theatres_and_shows(conn, movie_ids)
    seed_events(conn)
    seed_promos(conn)
    conn.commit()
    print("[seed] done")


if __name__ == "__main__":
    main()

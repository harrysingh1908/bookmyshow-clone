import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { search as searchApi } from "../api/endpoints";
import { useAuth } from "../store/auth";
import { CITIES, useCity } from "../store/city";
import type { EventItem, Movie } from "../types";

export function Navbar() {
  const { user, logout } = useAuth();
  const { city, setCity } = useCity();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ movies: Movie[]; events: EventItem[] }>({
    movies: [],
    events: [],
  });
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults({ movies: [], events: [] });
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await searchApi(q.trim());
        setResults(data);
        setOpen(true);
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
      setOpen(false);
    }
  };

  return (
    <header className="bg-bms-dark text-white sticky top-0 z-50 shadow-md">
      <div className="container-bms flex items-center gap-4 h-16">
        <Link to="/" className="flex items-center shrink-0">
          <span className="font-heading font-extrabold text-2xl">
            book<span className="text-bms-red">my</span>show
          </span>
        </Link>

        <form
          onSubmit={submitSearch}
          ref={boxRef}
          className="relative flex-1 max-w-xl hidden md:block"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => q.length >= 2 && setOpen(true)}
            placeholder="Search for Movies, Events, Plays, Sports and Activities"
            className="w-full rounded bg-white text-sm text-gray-800 px-4 py-2 outline-none"
          />
          {open && (results.movies.length > 0 || results.events.length > 0) && (
            <div className="absolute top-11 left-0 right-0 bg-white text-gray-800 rounded shadow-lg max-h-96 overflow-auto">
              {results.movies.map((m) => (
                <Link
                  key={`m${m.id}`}
                  to={`/movies/${m.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100"
                >
                  <img src={m.poster_url} className="w-8 h-12 object-cover rounded" />
                  <div>
                    <div className="text-sm font-medium">{m.title}</div>
                    <div className="text-xs text-bms-grey">Movie · {m.genres.join("/")}</div>
                  </div>
                </Link>
              ))}
              {results.events.map((ev) => (
                <Link
                  key={`e${ev.id}`}
                  to={`/events/${ev.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100"
                >
                  <img src={ev.image_url} className="w-8 h-12 object-cover rounded" />
                  <div>
                    <div className="text-sm font-medium">{ev.title}</div>
                    <div className="text-xs text-bms-grey">Event · {ev.category}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </form>

        <div className="ml-auto flex items-center gap-4">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="bg-transparent text-sm border-none outline-none cursor-pointer"
          >
            {CITIES.map((c) => (
              <option key={c} value={c} className="text-gray-800">
                {c}
              </option>
            ))}
          </select>

          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="text-sm hover:text-bms-red">
                Hi, {user.name.split(" ")[0]}
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="text-sm text-bms-grey hover:text-white"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-red text-sm py-1.5">
              Sign In
            </Link>
          )}
        </div>
      </div>

      <nav className="bg-bms-navy">
        <div className="container-bms flex gap-6 h-10 items-center text-sm text-gray-300">
          <Link to="/movies" className="hover:text-white">Movies</Link>
          <Link to="/events?category=Music" className="hover:text-white">Music</Link>
          <Link to="/events?category=Comedy" className="hover:text-white">Comedy</Link>
          <Link to="/events?category=Sports" className="hover:text-white">Sports</Link>
          <Link to="/events?category=Theatre & Arts" className="hover:text-white">Theatre</Link>
          <Link to="/events" className="hover:text-white">All Events</Link>
        </div>
      </nav>
    </header>
  );
}

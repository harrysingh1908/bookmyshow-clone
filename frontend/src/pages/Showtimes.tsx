import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getMovie, getMovieShowtimes } from "../api/endpoints";
import { Layout, Spinner } from "../components/Layout";
import { dayParts, formatTime } from "../lib/format";
import { useCity } from "../store/city";
import type { Movie, Showtime, TheatreWithShowtimes } from "../types";

function next7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const STATUS_STYLES: Record<string, string> = {
  available: "border-bms-green text-bms-green hover:bg-bms-green hover:text-white",
  filling_fast: "border-bms-amber text-bms-amber hover:bg-bms-amber hover:text-white",
  almost_full: "border-bms-red text-bms-red hover:bg-bms-red hover:text-white",
  housefull: "border-gray-300 text-gray-400 cursor-not-allowed",
};

export default function Showtimes() {
  const { id } = useParams();
  const movieId = Number(id);
  const navigate = useNavigate();
  const { city } = useCity();
  const days = next7Days();
  const [date, setDate] = useState(days[0]);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [data, setData] = useState<TheatreWithShowtimes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMovie(movieId).then((r) => setMovie(r.data));
  }, [movieId]);

  useEffect(() => {
    setLoading(true);
    getMovieShowtimes(movieId, { city, date })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [movieId, city, date]);

  const goToSeats = (s: Showtime) => {
    if (s.status === "housefull") return;
    navigate(`/showtimes/${s.id}/seats`);
  };

  return (
    <Layout>
      <div className="bg-white border-b">
        <div className="container-bms py-4 flex items-center gap-2 text-sm">
          <Link to={`/movies/${movieId}`} className="text-bms-red font-semibold">
            {movie?.title || "Movie"}
          </Link>
          <span className="text-bms-grey">› {city} › Showtimes</span>
        </div>
      </div>

      <div className="container-bms py-5">
        <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6">
          {days.map((d) => {
            const p = dayParts(d);
            const active = d === date;
            return (
              <button
                key={d}
                onClick={() => setDate(d)}
                className={`flex flex-col items-center justify-center w-16 h-16 rounded shrink-0 ${
                  active ? "bg-bms-red text-white" : "bg-white text-gray-700 border"
                }`}
              >
                <span className="text-xs uppercase">{p.weekday}</span>
                <span className="text-lg font-bold">{p.day}</span>
                <span className="text-xs uppercase">{p.month}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <Spinner />
        ) : data.length === 0 ? (
          <p className="text-bms-grey py-12 text-center">
            No shows for {city} on this date. Try another date or city.
          </p>
        ) : (
          <div className="space-y-4">
            {data.map(({ theatre, showtimes }) => (
              <div key={theatre.id} className="bg-white rounded-lg shadow-card p-4">
                <h3 className="font-heading font-semibold">{theatre.name}</h3>
                <p className="text-xs text-bms-grey mb-1">{theatre.address}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {theatre.amenities.map((a) => (
                    <span key={a} className="text-[11px] text-bms-grey border rounded px-1.5 py-0.5">
                      {a}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  {showtimes.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => goToSeats(s)}
                      title={`${s.format} · ${s.available_seats} seats left`}
                      className={`border rounded px-4 py-2 text-sm font-semibold bg-white transition-colors ${
                        STATUS_STYLES[s.status] || STATUS_STYLES.available
                      }`}
                    >
                      <div>{formatTime(s.start_time)}</div>
                      <div className="text-[10px] font-normal">{s.format}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-4 mt-6 text-xs text-bms-grey">
          <span><span className="text-bms-green">●</span> Available</span>
          <span><span className="text-bms-amber">●</span> Filling Fast</span>
          <span><span className="text-bms-red">●</span> Almost Full</span>
          <span><span className="text-gray-400">●</span> Housefull</span>
        </div>
      </div>
    </Layout>
  );
}

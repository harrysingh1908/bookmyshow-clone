import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMovie, getSeatMap, getShowtime, holdSeats } from "../api/endpoints";
import { Layout, Spinner } from "../components/Layout";
import { formatDate, formatTime, rupees } from "../lib/format";
import { useAuth } from "../store/auth";
import { useBooking } from "../store/booking";
import type { Seat, SeatMap, ShowtimeDetail } from "../types";

const CATEGORY_ORDER = ["Recliner", "Gold", "Silver"];

export default function SeatPicker() {
  const { showtimeId } = useParams();
  const sid = Number(showtimeId);
  const navigate = useNavigate();
  const { token } = useAuth();
  const setPending = useBooking((s) => s.setPending);

  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [showtime, setShowtime] = useState<ShowtimeDetail | null>(null);
  const [movieTitle, setMovieTitle] = useState("");
  const [selected, setSelected] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [proceeding, setProceeding] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getSeatMap(sid), getShowtime(sid)])
      .then(([sm, st]) => {
        setSeatMap(sm.data);
        setShowtime(st.data);
        getMovie(st.data.movie_id).then((m) => setMovieTitle(m.data.title));
      })
      .finally(() => setLoading(false));
  }, [sid]);

  const grouped = useMemo(() => {
    if (!seatMap) return [];
    const byCat: Record<string, Record<string, Seat[]>> = {};
    for (const seat of seatMap.seats) {
      byCat[seat.category] ??= {};
      byCat[seat.category][seat.row_label] ??= [];
      byCat[seat.category][seat.row_label].push(seat);
    }
    return CATEGORY_ORDER.filter((c) => byCat[c]).map((cat) => ({
      category: cat,
      price: seatMap.categories.find((c) => c.name === cat)?.price || 0,
      rows: Object.entries(byCat[cat]).sort(([a], [b]) => a.localeCompare(b)),
    }));
  }, [seatMap]);

  const toggle = (seat: Seat) => {
    if (seat.status !== "available") return;
    setError("");
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === seat.id);
      if (exists) return prev.filter((s) => s.id !== seat.id);
      if (prev.length >= 10) {
        setError("You can select a maximum of 10 seats.");
        return prev;
      }
      return [...prev, seat];
    });
  };

  const subtotal = selected.reduce((sum, s) => sum + s.price, 0);
  const fee = selected.length * 30;

  const proceed = async () => {
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(`/showtimes/${sid}/seats`)}`);
      return;
    }
    if (selected.length === 0 || !showtime) return;
    setProceeding(true);
    setError("");
    try {
      await holdSeats({ showtime_id: sid, seat_ids: selected.map((s) => s.id) });
      setPending({
        type: "movie",
        movieTitle,
        showtime,
        seats: selected,
        subtotal,
        convenienceFee: fee,
      });
      navigate("/checkout");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Those seats are no longer available.");
    } finally {
      setProceeding(false);
    }
  };

  if (loading) return <Layout><Spinner label="Loading seats..." /></Layout>;
  if (!seatMap || !showtime) return <Layout><p className="container-bms py-12">Showtime not found.</p></Layout>;

  const seatClass = (seat: Seat) => {
    const picked = selected.find((s) => s.id === seat.id);
    if (picked) return "bg-bms-red text-white border-bms-red";
    if (seat.status === "booked") return "bg-gray-300 border-gray-300 text-gray-400 cursor-not-allowed";
    if (seat.status === "held") return "bg-yellow-100 border-yellow-300 text-yellow-500 cursor-not-allowed";
    return "bg-white border-bms-green text-bms-green hover:bg-bms-green hover:text-white";
  };

  return (
    <Layout>
      <div className="bg-white border-b">
        <div className="container-bms py-3">
          <h1 className="font-heading font-bold">{movieTitle}</h1>
          <p className="text-sm text-bms-grey">
            {showtime.theatre_name} · {formatDate(showtime.date)} ·{" "}
            {formatTime(showtime.start_time)} · {showtime.format}
          </p>
        </div>
      </div>

      <div className="container-bms py-6 pb-40">
        <div className="overflow-x-auto">
          <div className="min-w-[640px] mx-auto w-fit">
            {grouped.map(({ category, price, rows }) => (
              <div key={category} className="mb-6">
                <div className="text-center text-xs text-bms-grey mb-2 border-b border-dashed pb-1">
                  {category} — {rupees(price)}
                </div>
                {rows.map(([row, seats]) => (
                  <div key={row} className="flex items-center gap-2 mb-1.5 justify-center">
                    <span className="w-5 text-xs text-bms-grey">{row}</span>
                    <div className="flex gap-1.5">
                      {seats
                        .sort((a, b) => a.col_number - b.col_number)
                        .map((seat) => (
                          <button
                            key={seat.id}
                            onClick={() => toggle(seat)}
                            title={`${seat.row_label}${seat.col_number}`}
                            className={`w-7 h-7 rounded text-[10px] border flex items-center justify-center transition-colors ${seatClass(seat)}`}
                          >
                            {seat.col_number}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* screen */}
            <div className="mt-8">
              <div className="h-2 bg-gradient-to-b from-gray-400 to-transparent rounded-[50%] mx-auto w-3/4" />
              <p className="text-center text-xs text-bms-grey mt-1 tracking-widest">
                All eyes this way please
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-5 mt-8 text-xs text-bms-grey">
          <span className="flex items-center gap-1"><span className="w-4 h-4 inline-block border border-bms-green rounded" /> Available</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 inline-block bg-bms-red rounded" /> Selected</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 inline-block bg-gray-300 rounded" /> Sold</span>
        </div>
      </div>

      {/* bottom bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="container-bms py-3 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-semibold">
                {selected.length} seat{selected.length > 1 ? "s" : ""}:{" "}
                {selected.map((s) => `${s.row_label}${s.col_number}`).join(", ")}
              </div>
              <div className="text-bms-grey">
                Subtotal {rupees(subtotal)} + {rupees(fee)} fees
              </div>
              {error && <div className="text-bms-red text-xs">{error}</div>}
            </div>
            <button className="btn-red px-8" onClick={proceed} disabled={proceeding}>
              {proceeding ? "Holding seats..." : `Proceed ${rupees(subtotal + fee)}`}
            </button>
          </div>
        </div>
      )}
      {error && selected.length === 0 && (
        <p className="container-bms text-bms-red text-sm pb-6">{error}</p>
      )}
    </Layout>
  );
}

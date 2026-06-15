import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEvent } from "../api/endpoints";
import { Layout, Spinner } from "../components/Layout";
import { formatDate, formatTime, rupees } from "../lib/format";
import { useAuth } from "../store/auth";
import { useBooking } from "../store/booking";
import type { EventItem } from "../types";

export default function EventDetail() {
  const { id } = useParams();
  const eventId = Number(id);
  const navigate = useNavigate();
  const { token } = useAuth();
  const setPending = useBooking((s) => s.setPending);

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    getEvent(eventId)
      .then((r) => setEvent(r.data))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <Layout><Spinner /></Layout>;
  if (!event) return <Layout><p className="container-bms py-12">Event not found.</p></Layout>;

  const unitPrice = event.price_from;
  const subtotal = unitPrice * qty;

  const book = () => {
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(`/events/${eventId}`)}`);
      return;
    }
    setPending({
      type: "event",
      eventId: event.id,
      eventTitle: event.title,
      venue: `${event.venue_name}, ${event.city}`,
      showDatetime: `${formatDate(event.date)}, ${formatTime(event.start_time)}`,
      unitPrice,
      quantity: qty,
      subtotal,
      convenienceFee: qty * 30,
    });
    navigate("/checkout");
  };

  return (
    <Layout>
      <div className="relative bg-bms-dark">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${event.image_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bms-dark to-bms-dark/60" />
        <div className="relative container-bms py-8 text-white flex gap-6">
          <img src={event.image_url} className="w-64 rounded-lg shadow-lg hidden sm:block object-cover" />
          <div>
            <span className="bg-bms-red text-xs px-2 py-0.5 rounded">{event.category}</span>
            <h1 className="font-heading text-3xl font-extrabold mt-2">{event.title}</h1>
            <p className="text-gray-200 mt-2 text-sm">
              {formatDate(event.date)} · {formatTime(event.start_time)}
            </p>
            <p className="text-gray-300 text-sm">{event.venue_name}</p>
            <p className="mt-3 font-semibold text-lg">{rupees(event.price_from)} onwards</p>
          </div>
        </div>
      </div>

      <div className="container-bms py-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 className="font-heading font-bold text-lg mb-2">About</h2>
            <p className="text-gray-700">{event.description}</p>
          </div>
          {event.artists.length > 0 && (
            <div>
              <h2 className="font-heading font-bold text-lg mb-2">Line-up</h2>
              <div className="flex flex-wrap gap-2">
                {event.artists.map((a) => (
                  <span key={a} className="bg-white border rounded-full px-3 py-1 text-sm">{a}</span>
                ))}
              </div>
            </div>
          )}
          <div>
            <h2 className="font-heading font-bold text-lg mb-2">Venue</h2>
            <p className="text-gray-700 text-sm mb-2">{event.venue_address}</p>
            <iframe
              title="map"
              className="w-full h-64 rounded-lg border"
              src={`https://www.google.com/maps?q=${encodeURIComponent(event.venue_name + " " + event.city)}&output=embed`}
            />
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-card p-4 sticky top-20">
            <h2 className="font-heading font-bold mb-3">Book Tickets</h2>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm">Quantity</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 border rounded text-bms-red font-bold">−</button>
                <span className="w-6 text-center">{qty}</span>
                <button onClick={() => setQty(Math.min(10, qty + 1))} className="w-8 h-8 border rounded text-bms-red font-bold">+</button>
              </div>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-bms-grey">Subtotal</span>
              <span>{rupees(subtotal)}</span>
            </div>
            <button onClick={book} className="btn-red w-full py-2.5">Proceed</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

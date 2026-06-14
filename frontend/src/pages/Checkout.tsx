import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkout, confirmBooking, validatePromo } from "../api/endpoints";
import { Layout } from "../components/Layout";
import { formatDate, formatTime, rupees } from "../lib/format";
import { useBooking } from "../store/booking";

const FNB = [
  { name: "Large Popcorn", price: 320 },
  { name: "Pepsi (Regular)", price: 180 },
  { name: "Nachos with Cheese", price: 280 },
  { name: "Combo: Popcorn + 2 Drinks", price: 650 },
];

export default function Checkout() {
  const navigate = useNavigate();
  const pending = useBooking((s) => s.pending);
  const clear = useBooking((s) => s.clear);

  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [fnb, setFnb] = useState<Record<string, number>>({});
  const [paying, setPaying] = useState(false);

  if (!pending) {
    return (
      <Layout>
        <div className="container-bms py-16 text-center">
          <p className="text-bms-grey">Your booking session has expired.</p>
          <button className="btn-red mt-4" onClick={() => navigate("/")}>Back to home</button>
        </div>
      </Layout>
    );
  }

  const fnbTotal = Object.entries(fnb).reduce((sum, [name, qty]) => {
    const item = FNB.find((f) => f.name === name);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const preDiscount = pending.subtotal + pending.convenienceFee + fnbTotal;
  const grandTotal = Math.max(0, preDiscount - discount);

  const applyPromo = async () => {
    if (!promo.trim()) return;
    const { data } = await validatePromo({ code: promo.trim(), amount: preDiscount });
    setPromoMsg(data.message);
    if (data.valid) {
      setDiscount(data.discount);
      setAppliedCode(data.code);
    } else {
      setDiscount(0);
      setAppliedCode("");
    }
  };

  const setQty = (name: string, delta: number) => {
    setFnb((prev) => {
      const next = { ...prev };
      next[name] = Math.max(0, (next[name] || 0) + delta);
      if (next[name] === 0) delete next[name];
      return next;
    });
    // re-validate promo against new amount lazily on next apply
  };

  const pay = async () => {
    setPaying(true);
    try {
      await checkout({ amount: grandTotal, method: "card", promo_code: appliedCode || undefined });
      let booking;
      if (pending.type === "movie") {
        booking = await confirmBooking({
          booking_type: "movie",
          showtime_id: pending.showtime.id,
          seat_ids: pending.seats.map((s) => s.id),
          title: pending.movieTitle,
          venue: `${pending.showtime.theatre_name}, ${pending.showtime.theatre_city}`,
          show_datetime: `${formatDate(pending.showtime.date)}, ${formatTime(pending.showtime.start_time)}`,
          addons: fnbTotal,
          discount,
          promo_code: appliedCode || undefined,
        });
      } else {
        booking = await confirmBooking({
          booking_type: "event",
          event_id: pending.eventId,
          quantity: pending.quantity,
          unit_price: pending.unitPrice,
          title: pending.eventTitle,
          venue: pending.venue,
          show_datetime: pending.showDatetime,
          addons: fnbTotal,
          discount,
          promo_code: appliedCode || undefined,
        });
      }
      clear();
      navigate(`/confirmation/${booking.data.id}`);
    } finally {
      setPaying(false);
    }
  };

  return (
    <Layout>
      <div className="container-bms py-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* summary */}
          <div className="bg-white rounded-lg shadow-card p-4">
            <h2 className="font-heading font-bold mb-3">Order Summary</h2>
            <h3 className="font-semibold">{pending.type === "movie" ? pending.movieTitle : pending.eventTitle}</h3>
            {pending.type === "movie" ? (
              <p className="text-sm text-bms-grey">
                {pending.showtime.theatre_name} · {formatDate(pending.showtime.date)} ·{" "}
                {formatTime(pending.showtime.start_time)} · {pending.showtime.format}
                <br />
                Seats: {pending.seats.map((s) => `${s.row_label}${s.col_number}`).join(", ")}
              </p>
            ) : (
              <p className="text-sm text-bms-grey">
                {pending.venue} · {pending.showDatetime}
                <br />
                {pending.quantity} ticket(s)
              </p>
            )}
          </div>

          {/* F&B */}
          <div className="bg-white rounded-lg shadow-card p-4">
            <h2 className="font-heading font-bold mb-3">Add Food &amp; Beverages</h2>
            <div className="space-y-3">
              {FNB.map((f) => (
                <div key={f.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-bms-grey">{rupees(f.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQty(f.name, -1)}
                      className="w-7 h-7 border rounded text-bms-red font-bold"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm">{fnb[f.name] || 0}</span>
                    <button
                      onClick={() => setQty(f.name, 1)}
                      className="w-7 h-7 border rounded text-bms-red font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* promo */}
          <div className="bg-white rounded-lg shadow-card p-4">
            <h2 className="font-heading font-bold mb-3">Apply Promo Code</h2>
            <div className="flex gap-2">
              <input
                value={promo}
                onChange={(e) => setPromo(e.target.value.toUpperCase())}
                placeholder="Enter code (e.g. BMS10)"
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              <button onClick={applyPromo} className="btn-red px-6">Apply</button>
            </div>
            {promoMsg && (
              <p className={`text-sm mt-2 ${discount > 0 ? "text-bms-green" : "text-bms-red"}`}>
                {promoMsg}
              </p>
            )}
          </div>
        </div>

        {/* price box */}
        <div>
          <div className="bg-white rounded-lg shadow-card p-4 sticky top-20">
            <h2 className="font-heading font-bold mb-3">Payment Details</h2>
            <div className="space-y-2 text-sm">
              <Row label="Ticket Subtotal" value={pending.subtotal} />
              <Row label="Convenience Fee" value={pending.convenienceFee} />
              {fnbTotal > 0 && <Row label="Food & Beverages" value={fnbTotal} />}
              {discount > 0 && <Row label={`Discount (${appliedCode})`} value={-discount} green />}
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Amount Payable</span>
                <span>{rupees(grandTotal)}</span>
              </div>
            </div>
            <button className="btn-red w-full mt-4 py-3" onClick={pay} disabled={paying}>
              {paying ? "Processing payment..." : `Pay ${rupees(grandTotal)}`}
            </button>
            <p className="text-[11px] text-bms-grey mt-2 text-center">
              This is a mock checkout — no real payment is taken.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Row({ label, value, green }: { label: string; value: number; green?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-bms-grey">{label}</span>
      <span className={green ? "text-bms-green" : ""}>
        {value < 0 ? "−" : ""}{rupees(Math.abs(value))}
      </span>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getBooking } from "../api/endpoints";
import { Layout, Spinner } from "../components/Layout";
import { rupees } from "../lib/format";
import type { Booking } from "../types";

export default function Confirmation() {
  const { id } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBooking(Number(id))
      .then((r) => setBooking(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><Spinner /></Layout>;
  if (!booking) return <Layout><p className="container-bms py-12">Booking not found.</p></Layout>;

  const seatLabels = booking.seats.map((s: any) => `${s.row_label}${s.col_number}`).join(", ");

  return (
    <Layout>
      <div className="container-bms py-8 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-bms-green text-white flex items-center justify-center text-3xl mx-auto animate-bounce">
            ✓
          </div>
          <h1 className="font-heading text-2xl font-bold mt-3">Booking Confirmed!</h1>
          <p className="text-bms-grey text-sm">
            Your tickets have been booked. Show this at the venue.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <div className="bg-bms-dark text-white p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-300">Booking ID</p>
              <p className="font-heading font-bold text-lg">{booking.booking_ref}</p>
            </div>
            <span className="bg-bms-green text-xs px-2 py-1 rounded uppercase">
              {booking.status}
            </span>
          </div>

          <div className="p-5 flex gap-5">
            <div className="bg-white p-2 border rounded">
              <QRCodeSVG value={booking.booking_ref} size={110} />
            </div>
            <div className="flex-1 text-sm">
              <h3 className="font-heading font-bold text-base">{booking.title}</h3>
              <p className="text-bms-grey mt-1">{booking.venue}</p>
              <p className="text-bms-grey">{booking.show_datetime}</p>
              {seatLabels ? (
                <p className="mt-2">
                  <span className="text-bms-grey">Seats: </span>
                  <span className="font-semibold">{seatLabels}</span>
                </p>
              ) : (
                <p className="mt-2">
                  <span className="text-bms-grey">Tickets: </span>
                  <span className="font-semibold">{booking.quantity}</span>
                </p>
              )}
            </div>
          </div>

          <div className="border-t px-5 py-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-bms-grey">Subtotal</span>
              <span>{rupees(booking.subtotal)}</span>
            </div>
            {booking.addons > 0 && (
              <div className="flex justify-between">
                <span className="text-bms-grey">Food &amp; Beverages</span>
                <span>{rupees(booking.addons)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-bms-grey">Convenience Fee</span>
              <span>{rupees(booking.convenience_fee)}</span>
            </div>
            {booking.discount > 0 && (
              <div className="flex justify-between text-bms-green">
                <span>Discount</span>
                <span>−{rupees(booking.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t pt-1">
              <span>Total Paid</span>
              <span>{rupees(booking.total)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={() => window.print()} className="flex-1 border border-bms-red text-bms-red rounded py-2 font-semibold">
            Download Ticket
          </button>
          <Link to="/profile" className="flex-1 btn-red text-center py-2">
            View All Bookings
          </Link>
        </div>
      </div>
    </Layout>
  );
}

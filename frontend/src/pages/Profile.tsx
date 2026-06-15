import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  cancelBooking,
  changePassword,
  getMyBookings,
  getOffers,
  updateMe,
} from "../api/endpoints";
import { Layout, Spinner } from "../components/Layout";
import { rupees } from "../lib/format";
import { useAuth } from "../store/auth";
import type { Booking, Promo } from "../types";

const TABS = ["Bookings", "Profile", "Offers"] as const;

export default function Profile() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [offers, setOffers] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyBookings(), getOffers()])
      .then(([b, o]) => {
        setBookings(b.data);
        setOffers(o.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const cancel = async (id: number) => {
    if (!confirm("Cancel this booking?")) return;
    const { data } = await cancelBooking(id);
    setBookings((prev) => prev.map((b) => (b.id === id ? data : b)));
  };

  return (
    <Layout>
      <div className="container-bms py-6 grid md:grid-cols-4 gap-6">
        <aside className="bg-white rounded-lg shadow-card p-4 h-fit">
          <div className="font-heading font-bold">{user?.name}</div>
          <div className="text-sm text-bms-grey mb-4">{user?.email}</div>
          <nav className="flex md:flex-col gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-left text-sm px-3 py-2 rounded ${
                  tab === t ? "bg-bms-red text-white" : "hover:bg-gray-100"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
        </aside>

        <section className="md:col-span-3">
          {loading ? (
            <Spinner />
          ) : tab === "Bookings" ? (
            <BookingsTab bookings={bookings} onCancel={cancel} />
          ) : tab === "Profile" ? (
            <ProfileTab user={user} setUser={setUser} />
          ) : (
            <OffersTab offers={offers} />
          )}
        </section>
      </div>
    </Layout>
  );
}

function BookingsTab({ bookings, onCancel }: { bookings: Booking[]; onCancel: (id: number) => void }) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-card p-8 text-center">
        <p className="text-bms-grey">You have no bookings yet.</p>
        <Link to="/movies" className="btn-red inline-block mt-3">Book now</Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <div key={b.id} className="bg-white rounded-lg shadow-card p-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-semibold">{b.title}</h3>
              <span className={`text-[11px] px-2 py-0.5 rounded uppercase ${
                b.status === "cancelled" ? "bg-gray-300 text-gray-600" : "bg-bms-green text-white"
              }`}>
                {b.status}
              </span>
            </div>
            <p className="text-sm text-bms-grey">{b.venue} · {b.show_datetime}</p>
            <p className="text-sm">
              {b.seats.length > 0
                ? `Seats: ${b.seats.map((s: any) => `${s.row_label}${s.col_number}`).join(", ")}`
                : `${b.quantity} ticket(s)`}{" "}
              · {rupees(b.total)} · <span className="text-bms-grey">{b.booking_ref}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link to={`/confirmation/${b.id}`} className="text-bms-red text-sm font-semibold">
              View ticket
            </Link>
            {b.status === "confirmed" && (
              <button onClick={() => onCancel(b.id)} className="text-bms-grey text-sm hover:text-bms-red">
                Cancel
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileTab({ user, setUser }: { user: any; setUser: (u: any) => void }) {
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", city: user?.city || "" });
  const [pw, setPw] = useState({ old_password: "", new_password: "" });
  const [msg, setMsg] = useState("");

  const save = async () => {
    const { data } = await updateMe(form);
    setUser(data);
    setMsg("Profile updated");
  };
  const savePw = async () => {
    try {
      await changePassword(pw);
      setPw({ old_password: "", new_password: "" });
      setMsg("Password changed");
    } catch (e: any) {
      setMsg(e.response?.data?.detail || "Could not change password");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-card p-5 max-w-md">
        <h3 className="font-heading font-bold mb-3">Edit Profile</h3>
        <div className="space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name" className="w-full border rounded px-3 py-2" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Phone" className="w-full border rounded px-3 py-2" />
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="City" className="w-full border rounded px-3 py-2" />
          <button onClick={save} className="btn-red">Save changes</button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-card p-5 max-w-md">
        <h3 className="font-heading font-bold mb-3">Change Password</h3>
        <div className="space-y-3">
          <input type="password" value={pw.old_password}
            onChange={(e) => setPw({ ...pw, old_password: e.target.value })}
            placeholder="Current password" className="w-full border rounded px-3 py-2" />
          <input type="password" value={pw.new_password}
            onChange={(e) => setPw({ ...pw, new_password: e.target.value })}
            placeholder="New password" className="w-full border rounded px-3 py-2" />
          <button onClick={savePw} className="btn-red">Update password</button>
        </div>
      </div>
      {msg && <p className="text-bms-green text-sm">{msg}</p>}
    </div>
  );
}

function OffersTab({ offers }: { offers: Promo[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {offers.map((o) => (
        <div key={o.code} className="bg-white rounded-lg shadow-card p-4 border-l-4 border-bms-red">
          <div className="font-heading font-bold text-lg">{o.code}</div>
          <p className="text-sm text-gray-700">{o.description}</p>
          <p className="text-xs text-bms-grey mt-1">Min order {rupees(o.min_amount)}</p>
        </div>
      ))}
    </div>
  );
}

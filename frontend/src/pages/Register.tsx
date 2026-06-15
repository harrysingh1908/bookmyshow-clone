import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { register } from "../api/endpoints";
import { Layout } from "../components/Layout";
import { useAuth } from "../store/auth";
import { CITIES } from "../store/city";

export default function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const setAuth = useAuth((s) => s.setAuth);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "Mumbai",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { data } = await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        password: form.password,
      });
      setAuth(data.access_token, data.user);
      navigate(redirect);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container-bms py-12 flex justify-center">
        <div className="bg-white rounded-lg shadow-card p-6 w-full max-w-md">
          <h1 className="font-heading text-2xl font-bold mb-1">Create Account</h1>
          <p className="text-bms-grey text-sm mb-5">Join BookMyShow in seconds</p>
          <form onSubmit={submit} className="space-y-3">
            <input required placeholder="Full Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded px-3 py-2" />
            <input type="email" required placeholder="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded px-3 py-2" />
            <input placeholder="Phone" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border rounded px-3 py-2" />
            <select value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border rounded px-3 py-2">
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input type="password" required placeholder="Password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded px-3 py-2" />
            <input type="password" required placeholder="Confirm Password" value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className="w-full border rounded px-3 py-2" />
            {error && <p className="text-bms-red text-sm">{error}</p>}
            <button className="btn-red w-full py-2.5" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
          <p className="text-sm text-bms-grey mt-4">
            Already have an account?{" "}
            <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-bms-red font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { login } from "../api/endpoints";
import { Layout } from "../components/Layout";
import { useAuth } from "../store/auth";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const setAuth = useAuth((s) => s.setAuth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await login(form);
      setAuth(data.access_token, data.user);
      navigate(redirect);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container-bms py-12 flex justify-center">
        <div className="bg-white rounded-lg shadow-card p-6 w-full max-w-md">
          <h1 className="font-heading text-2xl font-bold mb-1">Sign In</h1>
          <p className="text-bms-grey text-sm mb-5">Welcome back to BookMyShow</p>
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
            {error && <p className="text-bms-red text-sm">{error}</p>}
            <button className="btn-red w-full py-2.5" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <button
            onClick={() => alert("Password reset is not available in this demo.")}
            className="text-bms-red text-sm mt-3"
          >
            Forgot password?
          </button>
          <p className="text-sm text-bms-grey mt-4">
            New to BookMyShow?{" "}
            <Link to={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-bms-red font-semibold">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}

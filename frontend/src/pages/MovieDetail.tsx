import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getMovie, getReviews, postReview } from "../api/endpoints";
import { Layout, Spinner } from "../components/Layout";
import { StarRating } from "../components/StarRating";
import { formatDuration } from "../lib/format";
import { useAuth } from "../store/auth";
import type { Movie, Review } from "../types";

const TABS = ["About", "Trailers", "Cast & Crew", "Reviews"] as const;

export default function MovieDetail() {
  const { id } = useParams();
  const movieId = Number(id);
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]>("About");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 8, title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    Promise.all([getMovie(movieId), getReviews(movieId)])
      .then(([m, r]) => {
        setMovie(m.data);
        setReviews(r.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]);

  if (loading) return <Layout><Spinner /></Layout>;
  if (!movie) return <Layout><p className="container-bms py-12">Movie not found.</p></Layout>;

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await postReview(movieId, form);
      setForm({ rating: 8, title: "", body: "" });
      load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* banner */}
      <div className="relative bg-bms-dark">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${movie.banner_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bms-dark to-bms-dark/60" />
        <div className="relative container-bms py-8 flex gap-6 text-white">
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-44 rounded-lg shadow-lg shrink-0 hidden sm:block"
          />
          <div className="flex flex-col justify-center">
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold">{movie.title}</h1>
            <div className="mt-3">
              <StarRating rating={movie.avg_rating} votes={movie.vote_count} size="lg" />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {movie.formats.map((f) => (
                <span key={f} className="bg-white/20 px-2 py-0.5 rounded text-xs">{f}</span>
              ))}
              {movie.languages.map((l) => (
                <span key={l} className="bg-white/20 px-2 py-0.5 rounded text-xs">{l}</span>
              ))}
            </div>
            <p className="mt-3 text-gray-200 text-sm">
              {formatDuration(movie.duration_mins)} · {movie.genres.join(", ")} ·{" "}
              <span className="border border-white/40 px-1">{movie.certificate}</span>
            </p>
            <button
              onClick={() => navigate(`/movies/${movie.id}/booking`)}
              className="btn-red mt-5 w-fit text-base px-8 py-2.5"
            >
              Book tickets
            </button>
          </div>
        </div>
      </div>

      <div className="container-bms py-6">
        <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px ${
                tab === t ? "border-bms-red text-bms-red" : "border-transparent text-gray-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "About" && (
          <div className="max-w-3xl">
            <h3 className="font-heading font-bold text-lg mb-2">About the movie</h3>
            <p className="text-gray-700 leading-relaxed">{movie.description}</p>
          </div>
        )}

        {tab === "Trailers" && (
          <div className="max-w-3xl aspect-video">
            <iframe
              src={movie.trailer_url}
              title="trailer"
              className="w-full h-full rounded-lg"
              allowFullScreen
            />
          </div>
        )}

        {tab === "Cast & Crew" && (
          <div className="flex flex-wrap gap-6">
            {movie.cast.map((c) => (
              <div key={c.name} className="w-24 text-center">
                <img
                  src={c.photo}
                  alt={c.name}
                  className="w-24 h-24 rounded-full object-cover mx-auto"
                />
                <p className="text-sm font-semibold mt-2">{c.name}</p>
                <p className="text-xs text-bms-grey">{c.role}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "Reviews" && (
          <div className="max-w-3xl space-y-6">
            {token ? (
              <form onSubmit={submitReview} className="bg-white rounded-lg shadow-card p-4">
                <h3 className="font-heading font-bold mb-3">Rate {movie.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-sm">Your rating:</label>
                  <select
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} / 5</option>
                    ))}
                  </select>
                </div>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Review title"
                  className="w-full border rounded px-3 py-2 text-sm mb-2"
                />
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="w-full border rounded px-3 py-2 text-sm mb-3"
                />
                <button className="btn-red" disabled={submitting}>
                  {submitting ? "Posting..." : "Post review"}
                </button>
              </form>
            ) : (
              <p className="text-sm text-bms-grey">
                <Link to="/login" className="text-bms-red font-semibold">Sign in</Link> to write a review.
              </p>
            )}

            {reviews.length === 0 ? (
              <p className="text-bms-grey text-sm">No reviews yet. Be the first!</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-lg shadow-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{r.author_name}</span>
                    <span className="bg-bms-green text-white text-xs px-2 py-0.5 rounded">
                      ★ {r.rating}/5
                    </span>
                  </div>
                  {r.title && <p className="font-semibold mt-2 text-sm">{r.title}</p>}
                  <p className="text-gray-700 text-sm mt-1">{r.body}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

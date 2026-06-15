import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { search as searchApi } from "../api/endpoints";
import { EventCard } from "../components/EventCard";
import { Layout, Spinner } from "../components/Layout";
import { MovieCard } from "../components/MovieCard";
import type { EventItem, Movie } from "../types";

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [results, setResults] = useState<{ movies: Movie[]; events: EventItem[] }>({
    movies: [],
    events: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    searchApi(q)
      .then((r) => setResults(r.data))
      .finally(() => setLoading(false));
  }, [q]);

  const empty = results.movies.length === 0 && results.events.length === 0;

  return (
    <Layout>
      <div className="container-bms py-6">
        <h1 className="font-heading text-2xl font-bold mb-6">
          Results for “{q}”
        </h1>
        {loading ? (
          <Spinner />
        ) : empty ? (
          <p className="text-bms-grey py-12 text-center">No matches found.</p>
        ) : (
          <div className="space-y-8">
            {results.movies.length > 0 && (
              <section>
                <h2 className="font-heading font-bold mb-3">Movies</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  {results.movies.map((m) => (
                    <MovieCard key={m.id} movie={m} />
                  ))}
                </div>
              </section>
            )}
            {results.events.length > 0 && (
              <section>
                <h2 className="font-heading font-bold mb-3">Events</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                  {results.events.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

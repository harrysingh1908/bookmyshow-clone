import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents, getMovies, getUpcoming } from "../api/endpoints";
import { EventCard } from "../components/EventCard";
import { HeroCarousel } from "../components/HeroCarousel";
import { Layout, MovieRow, Spinner } from "../components/Layout";
import { MovieCard } from "../components/MovieCard";
import { useCity } from "../store/city";
import type { EventItem, Movie } from "../types";

export default function Home() {
  const { city } = useCity();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getMovies(), getUpcoming(), getEvents({ city })])
      .then(([m, u, e]) => {
        setMovies(m.data);
        setUpcoming(u.data);
        setEvents(e.data);
      })
      .finally(() => setLoading(false));
  }, [city]);

  if (loading) {
    return (
      <Layout>
        <Spinner label="Loading the latest shows..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <HeroCarousel movies={movies} />

      <div className="container-bms py-8 space-y-10">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-2xl font-bold">Recommended Movies</h2>
            <Link to="/movies" className="text-bms-red text-sm font-semibold">
              See All ›
            </Link>
          </div>
          <MovieRow>
            {movies.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </MovieRow>
        </section>

        {events.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl font-bold">Events in {city}</h2>
              <Link to="/events" className="text-bms-red text-sm font-semibold">
                See All ›
              </Link>
            </div>
            <MovieRow>
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </MovieRow>
          </section>
        )}

        {upcoming.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl font-bold">Coming Soon</h2>
            </div>
            <MovieRow>
              {upcoming.map((m) => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </MovieRow>
          </section>
        )}
      </div>

      <div className="bg-bms-dark text-white">
        <div className="container-bms py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-heading text-2xl font-bold">List your Show</h3>
            <p className="text-gray-300 text-sm mt-1">
              Got a show, event, activity or a great experience? Partner with us.
            </p>
          </div>
          <span className="btn-red">Contact today!</span>
        </div>
      </div>
    </Layout>
  );
}

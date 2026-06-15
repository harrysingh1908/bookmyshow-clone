import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getEventCategories, getEvents } from "../api/endpoints";
import { EventCard } from "../components/EventCard";
import { Layout, Spinner } from "../components/Layout";
import { useCity } from "../store/city";
import type { EventItem } from "../types";

export default function Events() {
  const { city } = useCity();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const [categories, setCategories] = useState<string[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEventCategories().then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const q: Record<string, string> = { city };
    if (category) q.category = category;
    getEvents(q)
      .then((r) => setEvents(r.data))
      .finally(() => setLoading(false));
  }, [city, category]);

  const setCategory = (c: string) => {
    if (c) setParams({ category: c });
    else setParams({});
  };

  return (
    <Layout>
      <div className="container-bms py-6">
        <h1 className="font-heading text-2xl font-bold mb-4">Events in {city}</h1>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setCategory("")}
            className={`px-4 py-1.5 rounded-full text-sm border ${
              !category ? "bg-bms-red text-white border-bms-red" : "bg-white border-gray-300"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full text-sm border ${
                category === c ? "bg-bms-red text-white border-bms-red" : "bg-white border-gray-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <Spinner />
        ) : events.length === 0 ? (
          <p className="text-bms-grey py-12 text-center">No events found in {city}.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

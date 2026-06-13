import { Link } from "react-router-dom";
import { rupees, formatDate } from "../lib/format";
import type { EventItem } from "../types";

export function EventCard({ event }: { event: EventItem }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="block w-[220px] shrink-0 rounded-lg overflow-hidden bg-white shadow-card group"
    >
      <div className="aspect-video overflow-hidden">
        <img
          src={event.image_url}
          alt={event.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-3">
        <h3 className="font-heading font-semibold text-sm truncate">{event.title}</h3>
        <p className="text-xs text-bms-grey mt-1">{formatDate(event.date)}</p>
        <p className="text-xs text-bms-grey truncate">{event.venue_name}</p>
        <p className="text-sm font-semibold mt-1">{rupees(event.price_from)} onwards</p>
      </div>
    </Link>
  );
}

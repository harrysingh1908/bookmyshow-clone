import { Link } from "react-router-dom";
import type { Movie } from "../types";

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      to={`/movies/${movie.id}`}
      className="block w-[180px] shrink-0 group"
    >
      <div className="relative rounded-lg overflow-hidden shadow-card aspect-[2/3] bg-bms-card">
        <img
          src={movie.poster_url}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {movie.avg_rating > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-2 py-1.5 flex items-center gap-1">
            <span className="text-bms-yellow">★</span>
            <span className="text-white text-sm font-semibold">
              {movie.avg_rating.toFixed(1)}/10
            </span>
          </div>
        )}
        {movie.is_upcoming && (
          <span className="absolute top-2 left-2 bg-bms-red text-white text-[10px] font-semibold px-2 py-0.5 rounded">
            COMING SOON
          </span>
        )}
      </div>
      <h3 className="mt-2 font-heading font-semibold text-[15px] truncate">
        {movie.title}
      </h3>
      <p className="text-bms-grey text-xs truncate">{movie.genres.join("/")}</p>
    </Link>
  );
}

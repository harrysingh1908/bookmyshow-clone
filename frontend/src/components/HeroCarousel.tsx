import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Movie } from "../types";

export function HeroCarousel({ movies }: { movies: Movie[] }) {
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();
  const slides = movies.slice(0, 5);

  useEffect(() => {
    if (slides.length === 0) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const m = slides[idx];

  return (
    <div
      className="relative h-[340px] md:h-[420px] cursor-pointer bg-bms-dark overflow-hidden"
      onClick={() => navigate(`/movies/${m.id}`)}
    >
      <img
        src={m.banner_url}
        alt={m.title}
        className="w-full h-full object-cover opacity-70 transition-opacity duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bms-dark via-bms-dark/50 to-transparent" />
      <div className="absolute inset-0 container-bms flex flex-col justify-center text-white">
        <span className="text-bms-red font-semibold tracking-wide text-sm mb-2">
          NOW SHOWING
        </span>
        <h1 className="font-heading text-3xl md:text-5xl font-extrabold max-w-xl">
          {m.title}
        </h1>
        <p className="mt-3 max-w-lg text-gray-200 line-clamp-2">{m.description}</p>
        <div className="mt-4">
          <span className="btn-red inline-block">Book Tickets</span>
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setIdx(i);
            }}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-6 bg-bms-red" : "w-2 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

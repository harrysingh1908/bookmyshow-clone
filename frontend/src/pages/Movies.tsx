import { useEffect, useMemo, useState } from "react";
import { getMovies } from "../api/endpoints";
import { Layout, Spinner } from "../components/Layout";
import { MovieCard } from "../components/MovieCard";
import type { Movie } from "../types";

const LANGUAGES = ["Hindi", "English", "Tamil", "Telugu", "Malayalam", "Marathi"];
const GENRES = ["Action", "Comedy", "Drama", "Thriller", "Romance", "Sci-Fi", "Crime"];
const FORMATS = ["2D", "3D", "IMAX", "4DX"];

export default function Movies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("");
  const [genre, setGenre] = useState("");
  const [format, setFormat] = useState("");
  const [sort, setSort] = useState("popularity");

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { sort };
    if (lang) params.lang = lang;
    if (genre) params.genre = genre;
    if (format) params.format = format;
    getMovies(params)
      .then((r) => setMovies(r.data))
      .finally(() => setLoading(false));
  }, [lang, genre, format, sort]);

  const activeFilters = useMemo(
    () => [lang, genre, format].filter(Boolean),
    [lang, genre, format]
  );

  const Chip = ({
    label,
    value,
    current,
    onClick,
  }: {
    label: string;
    value: string;
    current: string;
    onClick: (v: string) => void;
  }) => (
    <button
      onClick={() => onClick(current === value ? "" : value)}
      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
        current === value
          ? "bg-bms-red text-white border-bms-red"
          : "bg-white text-gray-700 border-gray-300 hover:border-bms-red"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Layout>
      <div className="container-bms py-6">
        <h1 className="font-heading text-2xl font-bold mb-4">Movies</h1>

        <div className="bg-white rounded-lg shadow-card p-4 space-y-3 mb-6">
          <div>
            <div className="text-xs font-semibold text-bms-grey mb-2">LANGUAGE</div>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <Chip key={l} label={l} value={l} current={lang} onClick={setLang} />
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-bms-grey mb-2">GENRE</div>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <Chip key={g} label={g} value={g} current={genre} onClick={setGenre} />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-xs font-semibold text-bms-grey mb-2">FORMAT</div>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((f) => (
                  <Chip key={f} label={f} value={f} current={format} onClick={setFormat} />
                ))}
              </div>
            </div>
            <div className="ml-auto">
              <div className="text-xs font-semibold text-bms-grey mb-2">SORT BY</div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="popularity">Popularity</option>
                <option value="rating">Rating</option>
                <option value="release">Release Date</option>
              </select>
            </div>
          </div>
          {activeFilters.length > 0 && (
            <button
              onClick={() => {
                setLang("");
                setGenre("");
                setFormat("");
              }}
              className="text-bms-red text-sm font-semibold"
            >
              Clear all filters
            </button>
          )}
        </div>

        {loading ? (
          <Spinner />
        ) : movies.length === 0 ? (
          <p className="text-bms-grey py-12 text-center">No movies match your filters.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
            {movies.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

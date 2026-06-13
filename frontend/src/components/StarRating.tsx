export function StarRating({
  rating,
  votes,
  size = "sm",
}: {
  rating: number;
  votes?: number;
  size?: "sm" | "lg";
}) {
  if (!rating) {
    return <span className="text-bms-grey text-sm">Not yet rated</span>;
  }
  return (
    <div className="flex items-center gap-1">
      <span className="text-bms-yellow text-lg leading-none">★</span>
      <span className={size === "lg" ? "text-lg font-semibold" : "text-sm font-semibold"}>
        {rating.toFixed(1)}/10
      </span>
      {votes != null && votes > 0 && (
        <span className="text-bms-grey text-xs ml-1">
          {votes >= 1000 ? `${(votes / 1000).toFixed(1)}K` : votes} Votes
        </span>
      )}
    </div>
  );
}

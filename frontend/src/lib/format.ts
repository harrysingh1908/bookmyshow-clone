export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const formatDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

export const formatTime = (t?: string) => {
  if (!t) return "";
  const [hh, mm] = t.split(":");
  let h = parseInt(hh, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mm} ${ampm}`;
};

export const formatDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export const dayParts = (d: string) => {
  const date = new Date(d);
  return {
    weekday: date.toLocaleDateString("en-IN", { weekday: "short" }),
    day: date.getDate(),
    month: date.toLocaleDateString("en-IN", { month: "short" }),
  };
};

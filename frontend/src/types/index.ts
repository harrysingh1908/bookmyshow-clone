export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  created_at: string;
}

export interface CastMember {
  name: string;
  role: string;
  photo: string;
}

export interface Movie {
  id: number;
  title: string;
  description: string;
  duration_mins: number;
  languages: string[];
  genres: string[];
  formats: string[];
  certificate: string;
  release_date?: string;
  poster_url?: string;
  banner_url?: string;
  trailer_url?: string;
  cast: CastMember[];
  avg_rating: number;
  vote_count: number;
  is_upcoming: boolean;
}

export interface Theatre {
  id: number;
  name: string;
  chain: string;
  city: string;
  address: string;
  amenities: string[];
}

export interface Showtime {
  id: number;
  movie_id: number;
  date: string;
  start_time: string;
  available_seats: number;
  total_seats: number;
  status: string;
  format: string;
}

export interface TheatreWithShowtimes {
  theatre: Theatre;
  showtimes: Showtime[];
}

export interface ShowtimeDetail {
  id: number;
  movie_id: number;
  date: string;
  start_time: string;
  format: string;
  screen_name: string;
  theatre_id: number;
  theatre_name: string;
  theatre_city: string;
  theatre_address: string;
}

export interface Seat {
  id: number;
  row_label: string;
  col_number: number;
  category: string;
  price: number;
  status: "available" | "booked" | "held";
}

export interface SeatCategory {
  name: string;
  price: number;
}

export interface SeatMap {
  showtime_id: number;
  movie_id: number;
  screen_name: string;
  format: string;
  theatre_name: string;
  rows: number;
  cols: number;
  categories: SeatCategory[];
  seats: Seat[];
}

export interface EventItem {
  id: number;
  title: string;
  description: string;
  category: string;
  city: string;
  venue_name: string;
  venue_address: string;
  date: string;
  start_time?: string;
  end_time?: string;
  image_url?: string;
  artists: string[];
  price_from: number;
  price_to: number;
  available_tickets: number;
  total_tickets: number;
}

export interface Review {
  id: number;
  movie_id: number;
  user_id: number;
  author_name: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
}

export interface Booking {
  id: number;
  user_id: number;
  booking_type: "movie" | "event";
  showtime_id?: number;
  event_id?: number;
  title: string;
  venue: string;
  show_datetime: string;
  seats: any[];
  quantity: number;
  subtotal: number;
  convenience_fee: number;
  discount: number;
  total: number;
  status: string;
  booking_ref: string;
  created_at: string;
}

export interface Promo {
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  min_amount: number;
}

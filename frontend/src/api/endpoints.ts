import { api } from "./client";
import type {
  Booking,
  EventItem,
  Movie,
  Promo,
  Review,
  SeatMap,
  ShowtimeDetail,
  TheatreWithShowtimes,
  User,
} from "../types";

// ---- Auth ----
export const register = (data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
}) => api.post<{ access_token: string; user: User }>("/auth/register", data);

export const login = (data: { email: string; password: string }) =>
  api.post<{ access_token: string; user: User }>("/auth/login", data);

export const getMe = () => api.get<User>("/auth/me");
export const updateMe = (data: Partial<User>) => api.patch<User>("/auth/me", data);
export const changePassword = (data: { old_password: string; new_password: string }) =>
  api.post("/auth/me/password", data);

// ---- Movies ----
export const getMovies = (params?: Record<string, string>) =>
  api.get<Movie[]>("/movies", { params });
export const getUpcoming = () => api.get<Movie[]>("/movies/upcoming");
export const getMovie = (id: number) => api.get<Movie>(`/movies/${id}`);
export const getMovieShowtimes = (id: number, params?: Record<string, string>) =>
  api.get<TheatreWithShowtimes[]>(`/movies/${id}/showtimes`, { params });
export const getReviews = (id: number) => api.get<Review[]>(`/movies/${id}/reviews`);
export const postReview = (
  id: number,
  data: { rating: number; title: string; body: string }
) => api.post<Review>(`/movies/${id}/reviews`, data);

// ---- Showtimes ----
export const getShowtime = (id: number) => api.get<ShowtimeDetail>(`/showtimes/${id}`);
export const getSeatMap = (id: number) => api.get<SeatMap>(`/showtimes/${id}/seats`);

// ---- Events ----
export const getEvents = (params?: Record<string, string>) =>
  api.get<EventItem[]>("/events", { params });
export const getEventCategories = () => api.get<string[]>("/events/categories");
export const getEvent = (id: number) => api.get<EventItem>(`/events/${id}`);

// ---- Bookings ----
export const holdSeats = (data: { showtime_id: number; seat_ids: number[] }) =>
  api.post("/bookings/hold", data);
export const confirmBooking = (data: any) => api.post<Booking>("/bookings/confirm", data);
export const getMyBookings = () => api.get<Booking[]>("/bookings/mine");
export const cancelBooking = (id: number) => api.delete<Booking>(`/bookings/${id}`);

// ---- Payments ----
export const validatePromo = (data: { code: string; amount: number }) =>
  api.post<{ valid: boolean; code: string; discount: number; message: string }>(
    "/payments/validate-promo",
    data
  );
export const checkout = (data: { amount: number; method?: string; promo_code?: string }) =>
  api.post<{ status: string; transaction_id: string; amount: number }>(
    "/payments/checkout",
    data
  );
export const getOffers = () => api.get<Promo[]>("/payments/offers");

// ---- Search ----
export const search = (q: string) =>
  api.get<{ movies: Movie[]; events: EventItem[] }>("/search", { params: { q } });

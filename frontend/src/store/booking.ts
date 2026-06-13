import { create } from "zustand";
import type { Seat, ShowtimeDetail } from "../types";

export interface PendingMovieBooking {
  type: "movie";
  movieTitle: string;
  showtime: ShowtimeDetail;
  seats: Seat[];
  subtotal: number;
  convenienceFee: number;
}

export interface PendingEventBooking {
  type: "event";
  eventId: number;
  eventTitle: string;
  venue: string;
  showDatetime: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  convenienceFee: number;
}

export type PendingBooking = PendingMovieBooking | PendingEventBooking;

interface BookingState {
  pending: PendingBooking | null;
  setPending: (b: PendingBooking) => void;
  clear: () => void;
}

export const useBooking = create<BookingState>((set) => ({
  pending: null,
  setPending: (pending) => set({ pending }),
  clear: () => set({ pending: null }),
}));

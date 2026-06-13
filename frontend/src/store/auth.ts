import { create } from "zustand";
import type { User } from "../types";

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem("bms_token"),
  user: JSON.parse(localStorage.getItem("bms_user") || "null"),
  setAuth: (token, user) => {
    localStorage.setItem("bms_token", token);
    localStorage.setItem("bms_user", JSON.stringify(user));
    set({ token, user });
  },
  setUser: (user) => {
    localStorage.setItem("bms_user", JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem("bms_token");
    localStorage.removeItem("bms_user");
    set({ token: null, user: null });
  },
}));

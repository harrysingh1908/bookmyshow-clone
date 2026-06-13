import { create } from "zustand";

export const CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai"];

interface CityState {
  city: string;
  setCity: (city: string) => void;
}

export const useCity = create<CityState>((set) => ({
  city: localStorage.getItem("bms_city") || "Mumbai",
  setCity: (city) => {
    localStorage.setItem("bms_city", city);
    set({ city });
  },
}));

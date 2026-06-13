/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bms: {
          red: "#E8122D",
          "red-dark": "#C20E26",
          dark: "#1A1A2E",
          card: "#1E1E30",
          navy: "#222539",
          yellow: "#F5C518",
          green: "#28A745",
          amber: "#FFC107",
          grey: "#6C757D",
          border: "#2D2D44",
          light: "#F5F5FA",
        },
      },
      fontFamily: {
        heading: ["Montserrat", "sans-serif"],
        body: ["Open Sans", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};

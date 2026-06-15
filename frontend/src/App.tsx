import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Checkout from "./pages/Checkout";
import Confirmation from "./pages/Confirmation";
import EventDetail from "./pages/EventDetail";
import Events from "./pages/Events";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MovieDetail from "./pages/MovieDetail";
import Movies from "./pages/Movies";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Search from "./pages/Search";
import SeatPicker from "./pages/SeatPicker";
import Showtimes from "./pages/Showtimes";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/movies" element={<Movies />} />
      <Route path="/movies/:id" element={<MovieDetail />} />
      <Route path="/movies/:id/booking" element={<Showtimes />} />
      <Route path="/showtimes/:showtimeId/seats" element={<SeatPicker />} />
      <Route path="/events" element={<Events />} />
      <Route path="/events/:id" element={<EventDetail />} />
      <Route path="/search" element={<Search />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/confirmation/:id"
        element={
          <ProtectedRoute>
            <Confirmation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

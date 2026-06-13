export function Footer() {
  return (
    <footer className="bg-bms-dark text-gray-400 mt-12">
      <div className="container-bms py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <h4 className="text-white font-heading font-semibold mb-3">Movies</h4>
          <p>Now Showing</p>
          <p>Upcoming</p>
          <p>Exclusives</p>
        </div>
        <div>
          <h4 className="text-white font-heading font-semibold mb-3">Events</h4>
          <p>Music</p>
          <p>Comedy</p>
          <p>Sports</p>
        </div>
        <div>
          <h4 className="text-white font-heading font-semibold mb-3">Help</h4>
          <p>About Us</p>
          <p>Contact</p>
          <p>FAQs</p>
        </div>
        <div>
          <h4 className="text-white font-heading font-semibold mb-3">Follow</h4>
          <p>Twitter</p>
          <p>Instagram</p>
          <p>YouTube</p>
        </div>
      </div>
      <div className="border-t border-bms-border py-5 text-center text-xs">
        <span className="font-heading font-extrabold text-white text-lg">
          book<span className="text-bms-red">my</span>show
        </span>
        <p className="mt-2">
          This is a clone built for learning purposes. Not affiliated with BookMyShow.
        </p>
      </div>
    </footer>
  );
}

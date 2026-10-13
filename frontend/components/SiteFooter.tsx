import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <p className="brand-name">
            TripPilot<span>AI</span>
          </p>
          <p className="footer-copy">
            Premium flight search, demo bookings, and an AI travel copilot —
            designed for curious travelers.
          </p>
        </div>

        <div className="footer-links">
          <Link href="/flights">Search flights</Link>
          <Link href="/bookings">My bookings</Link>
          <Link href="/#assistant">Ask the assistant</Link>
          <Link href="/login">Sign in</Link>
        </div>
      </div>
      <p className="footer-legal">
        © 2026 TripPilot AI. Demo bookings are not real
        airline tickets. AI answers can be imperfect.
      </p>
    </footer>
  );
}

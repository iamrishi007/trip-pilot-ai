
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import { authenticatedRequest, getToken } from "@/lib/api";

type Booking = {
  id: string;
  userId?: string;
  flightId: string;
  status: string;
  passengerCount: number;
  price?: string | number | null;
  currency?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export default function BookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState("");
  const [cancelMessage, setCancelMessage] = useState("");

  const loadBookings = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      if (!getToken()) {
        router.replace("/login");
        return;
      }

      const data = await authenticatedRequest<Booking[]>("/bookings", {
        method: "GET",
      });

      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your bookings.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBookings();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadBookings]);

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function formatPrice(booking: Booking) {
    if (
      booking.price === undefined ||
      booking.price === null ||
      booking.price === "" ||
      !booking.currency
    ) {
      return "Price unavailable";
    }

    return `${booking.currency} ${booking.price}`;
  }

  function statusClass(status: string) {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "status-pill status-confirmed";
      case "cancelled":
        return "status-pill status-cancelled";
      default:
        return "status-pill status-other";
    }
  }

  async function handleCancelBooking(booking: Booking) {
    if (booking.status.toLowerCase() === "cancelled") return;

    const confirmed = window.confirm(
      `Are you sure you want to cancel booking ${booking.id}?`,
    );

    if (!confirmed) return;

    setCancelError("");
    setCancelMessage("");
    setCancellingId(booking.id);

    try {
      await authenticatedRequest(
        `/bookings/${encodeURIComponent(booking.id)}/cancel`,
        { method: "PATCH" },
      );

      setCancelMessage("Booking cancellation request completed.");
      await loadBookings();
    } catch (err) {
      setCancelError(
        err instanceof Error
          ? err.message
          : "Unable to cancel this booking.",
      );
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <PageShell>
      <div className="wide-wrap">
        <p className="eyebrow">Your itinerary</p>
        <h1 className="page-title">My Bookings</h1>

        <p className="lede">
          These are your PostgreSQL booking records. Status and booking IDs
          come from the NestJS API. They are not airline tickets.
        </p>

        <div className="heading-row" style={{ marginBottom: 20 }}>
          <p className="lede" style={{ margin: 0 }}>
            {loading
              ? "Loading bookings..."
              : `${bookings.length} booking${bookings.length === 1 ? "" : "s"} found`}
          </p>

          <button
            type="button"
            onClick={() => void loadBookings()}
            disabled={loading || cancellingId !== null}
            className="btn btn-ghost"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {cancelMessage && (
          <p role="status" className="alert alert-success">
            {cancelMessage}
          </p>
        )}

        {cancelError && (
          <p role="alert" className="alert alert-error">
            {cancelError}
          </p>
        )}

        {loading && (
          <div className="loading-card surface-card">
            Loading your bookings...
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="alert alert-error">
            <p className="font-semibold">Could not load bookings</p>
            <p>{error}</p>

            <button
              type="button"
              onClick={() => void loadBookings()}
              className="btn btn-primary"
              style={{ marginTop: 12 }}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="empty-state surface-card">
            <h2>No bookings yet</h2>
            <p className="lede">
              Your saved bookings will appear here after you book a flight.
            </p>

            <Link href="/flights" className="btn btn-primary">
              Search flights
            </Link>
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="stack">
            {bookings.map((booking) => {
              const isCancelled =
                booking.status.toLowerCase() === "cancelled";

              return (
                <article key={booking.id} className="booking-card">
                  <div className="booking-top">
                    <div>
                      <p className="route-meta">Booking ID</p>
                      <p
                        className="font-semibold"
                        style={{ wordBreak: "break-all" }}
                      >
                        {booking.id}
                      </p>
                    </div>

                    <span className={statusClass(booking.status)}>
                      {booking.status}
                    </span>
                  </div>

                  <div
                    className="destination-grid"
                    style={{ margin: "22px 0 0" }}
                  >
                    <div>
                      <p className="route-meta">Flight offer ID</p>
                      <p style={{ wordBreak: "break-all" }}>
                        {booking.flightId}
                      </p>
                    </div>

                    <div>
                      <p className="route-meta">Passengers</p>
                      <p>{booking.passengerCount}</p>
                    </div>

                    <div>
                      <p className="route-meta">Total flight price</p>
                      <p className="price">{formatPrice(booking)}</p>
                    </div>

                    <div>
                      <p className="route-meta">Booked on</p>
                      <p>{formatDate(booking.createdAt)}</p>
                    </div>

                    {booking.updatedAt && (
                      <div>
                        <p className="route-meta">Last updated</p>
                        <p>{formatDate(booking.updatedAt)}</p>
                      </div>
                    )}
                  </div>

                  {!isCancelled && (
                    <div style={{ marginTop: 20 }}>
                      <button
                        type="button"
                        onClick={() => void handleCancelBooking(booking)}
                        disabled={cancellingId !== null}
                        className="btn btn-danger"
                      >
                        {cancellingId === booking.id
                          ? "Cancelling..."
                          : "Cancel booking"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}

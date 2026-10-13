"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookingStepper from "@/components/BookingStepper";
import JourneyDetails from "@/components/JourneyDetails";
import PageShell from "@/components/PageShell";
import { getToken, requireAuthPath } from "@/lib/api";
import { getCheckout, type CheckoutPayload } from "@/lib/checkout";
import { flightCurrency, flightPrice } from "@/lib/flights";

export default function ReviewBookingPage() {
  const router = useRouter();
  const [checkout, setCheckout] = useState<CheckoutPayload | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace(requireAuthPath("/bookings/review"));
      return;
    }

    const payload = getCheckout();
    if (!payload) {
      router.replace("/flights");
      return;
    }

    setCheckout(payload);
    setReady(true);
  }, [router]);

  if (!ready || !checkout) {
    return (
      <PageShell>
        <div className="wide-wrap">
          <div className="loading-card surface-card">Loading booking review...</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="wide-wrap">
        <p className="eyebrow">Review</p>
        <h1 className="page-title">Review your booking</h1>
        <p className="lede">
          Confirm the itinerary and passenger count before simulated payment.
          No airline ticket is purchased at this step.
        </p>

        <BookingStepper current="Review" />

        <div className="stack">
          <JourneyDetails title="Outbound journey" slice={checkout.flight.slices?.[0]} />
          {checkout.flight.slices && checkout.flight.slices.length > 1 && (
            <JourneyDetails
              title="Return journey"
              slice={checkout.flight.slices[1]}
            />
          )}
        </div>

        <div className="surface-card" style={{ padding: 16, marginTop: 16 }}>
          <p className="route-meta">
            {checkout.originCity} ({checkout.origin}) → {checkout.destinationCity}{" "}
            ({checkout.destination})
          </p>
          <div className="heading-row" style={{ marginTop: 12 }}>
            <p>Passengers: {checkout.passengers}</p>
            <p className="price">
              {flightCurrency(checkout.flight)}{" "}
              {flightPrice(checkout.flight) ?? "Price unavailable"}
            </p>
          </div>
        </div>

        <p className="lede">
          Demo booking only: payment on the next page is simulated. After that,
          TripPilot saves a database record. It does not issue a real ticket.
        </p>

        <div className="filter-bar">
          <Link href="/flights" className="btn btn-ghost">
            Back to results
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => router.push("/bookings/payment")}
          >
            Continue to payment
          </button>
        </div>
      </div>
    </PageShell>
  );
}

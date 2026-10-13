"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookingStepper from "@/components/BookingStepper";
import PageShell from "@/components/PageShell";
import { createBooking, getToken, requireAuthPath } from "@/lib/api";
import {
  getCheckout,
  saveConfirmation,
  type CheckoutPayload,
  type ConfirmationPayload,
} from "@/lib/checkout";
import { flightCurrency, flightPrice } from "@/lib/flights";

const METHODS: Array<{
  id: ConfirmationPayload["paymentMethod"];
  title: string;
  detail: string;
}> = [
  {
    id: "card",
    title: "Simulated card",
    detail: "Uses a demo Visa ending 4242. No card number is collected.",
  },
  {
    id: "upi",
    title: "Simulated UPI",
    detail: "Uses traveler@trippilot as a fake VPA. No real UPI request is sent.",
  },
  {
    id: "wallet",
    title: "Simulated wallet",
    detail: "Pays from a demo TripPilot wallet. No real money moves.",
  },
];

export default function PaymentPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [method, setMethod] =
    useState<ConfirmationPayload["paymentMethod"]>("card");
  const [acknowledged, setAcknowledged] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState<CheckoutPayload | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace(requireAuthPath("/bookings/payment"));
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const current = getCheckout();
    if (!current) {
      router.replace("/flights");
      return;
    }

    if (!acknowledged) {
      setError("Please confirm that this payment is simulated.");
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 700));

      if (simulateFailure) {
        throw new Error(
          "Simulated payment failed. No money was charged and no booking was created.",
        );
      }

      const booking = await createBooking(
        current.flight.id,
        Number(current.passengers),
      );

      saveConfirmation({
        booking,
        checkout: current,
        paymentMethod: method,
      });

      router.push("/bookings/confirmation");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Payment could not be completed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!ready || !checkout) {
    return (
      <PageShell>
        <div className="wide-wrap">
          <div className="loading-card surface-card">Loading payment...</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="wide-wrap">
        <p className="eyebrow">Dummy payment</p>
        <h1 className="page-title">Simulated payment</h1>
        <p className="lede">
          This checkout is a demo. TripPilot does not collect real payment
          credentials and does not issue an airline ticket.
        </p>

        <BookingStepper current="Payment" />

        <div className="surface-card" style={{ padding: 16, marginBottom: 20 }}>
          <p className="font-semibold">Amount due (demo)</p>
          <p className="price">
            {flightCurrency(checkout.flight)}{" "}
            {flightPrice(checkout.flight) ?? "Price unavailable"}
          </p>
          <p className="route-meta">
            {checkout.originCity} → {checkout.destinationCity} ·{" "}
            {checkout.passengers} passenger(s)
          </p>
        </div>

        <form className="surface-card" style={{ padding: 20 }} onSubmit={handleSubmit}>
          <fieldset className="stack" style={{ border: 0, padding: 0 }}>
            <legend className="font-semibold">Choose a simulated method</legend>
            {METHODS.map((item) => (
              <label key={item.id} className="payment-option">
                <input
                  type="radio"
                  name="method"
                  value={item.id}
                  checked={method === item.id}
                  onChange={() => setMethod(item.id)}
                />
                <span>
                  <strong>{item.title}</strong>
                  <span className="route-meta">{item.detail}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <label className="payment-option" style={{ marginTop: 16 }}>
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            <span>
              I understand this is a simulated payment and no real ticket will
              be issued.
            </span>
          </label>

          <label className="payment-option">
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(event) => setSimulateFailure(event.target.checked)}
            />
            <span>Simulate a payment failure for testing</span>
          </label>

          {error && (
            <p role="alert" className="alert alert-error">
              {error}
            </p>
          )}

          <div className="filter-bar">
            <Link href="/bookings/review" className="btn btn-ghost">
              Back to review
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Processing demo payment..." : "Pay now (simulated)"}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}

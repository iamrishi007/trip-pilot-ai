"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookingStepper from "@/components/BookingStepper";
import PageShell from "@/components/PageShell";
import { getBooking, getToken } from "@/lib/api";
import { getConfirmation, type ConfirmationPayload } from "@/lib/checkout";

export default function ConfirmationPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<ConfirmationPayload | null>(null);
  const [statusNote, setStatusNote] = useState("");

  useEffect(() => {
    const stored = getConfirmation();
    if (!stored) {
      router.replace("/bookings");
      return;
    }

    setPayload(stored);

    if (!getToken()) return;

    void getBooking(stored.booking.id)
      .then((booking) => {
        setPayload({ ...stored, booking });
        setStatusNote("");
      })
      .catch(() => {
        setStatusNote(
""        );
      });
  }, [router]);

  if (!payload) {
    return (
      <PageShell>
        <div className="wide-wrap">
          <div className="loading-card surface-card">Loading confirmation...</div>
        </div>
      </PageShell>
    );
  }

  const { booking, checkout, paymentMethod } = payload;

  return (
    <PageShell>
      <div className="wide-wrap">
        <p className="eyebrow">Confirmation</p>
        <h1 className="page-title">Demo booking confirmed</h1>
        <p className="lede">
        
        </p>

        <BookingStepper current="Confirmed" />

        <div className="alert alert-success">
          <h2><b>Booking reference :</b> {booking.id}</h2>
          <p><b>Status :</b> {booking.status}</p>
          <p>Passengers : {booking.passengerCount}</p>
          <p>Simulated payment: {paymentMethod}</p>
          <p>
            Route : {checkout.originCity} ({checkout.origin}) →{" "}
            {checkout.destinationCity} ({checkout.destination})
          </p>
          {statusNote && <p className="lede">{statusNote}</p>}
        </div>

        <div className="filter-bar">
          <Link href="/bookings" className="btn btn-primary">
            View my bookings
          </Link>
          <Link href="/flights" className="btn btn-ghost">
            Search another flight
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

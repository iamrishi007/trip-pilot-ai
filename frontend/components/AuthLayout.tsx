"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const AUTH_IMAGE =
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80";

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="auth-shell">
      <section className={`auth-visual ${imageFailed ? "is-fallback" : ""}`}>
        {!imageFailed && (
          <Image
            src={AUTH_IMAGE}
            alt=""
            fill
            sizes="50vw"
            priority
            onError={() => setImageFailed(true)}
          />
        )}
        <div className="auth-visual-copy">
          <p className="eyebrow">TripPilot AI</p>
          <h2>Fly farther with a calmer, clearer cockpit.</h2>
          <p>
            Search live offers, keep demo bookings organized, and ask the
            assistant when you need a second opinion.
          </p>
        </div>
      </section>

      <section className="auth-panel">
        <Link href="/" className="text-link">
          ← Back to TripPilot AI
        </Link>
        <h1>{title}</h1>
        <p className="lede">{subtitle}</p>
        {children}
      </section>
    </div>
  );
}

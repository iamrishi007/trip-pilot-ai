"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import FlightSearchForm from "@/components/FlightSearchForm";
import HeroVisual from "@/components/HeroVisual";
import PageShell from "@/components/PageShell";
import TravelChat from "@/components/TravelChat";
import { flightSearchQuery } from "@/lib/flights";

const destinations = [
  {
    city: "Santorini",
    src: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=900&q=80",
  },
  {
    city: "Kyoto",
    src: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80",
  },
  {
    city: "New York",
    src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=900&q=80",
  },
];

export default function Home() {
  const router = useRouter();
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>(
    {},
  );

  return (
    <PageShell>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Your personal AI travel copilot</p>

          <h1>
            Fly beautifully.
            <br />
            <em>Plan with intelligence.</em>
          </h1>

          <p className="lede">
            Discover your next destination, explore flight options, and
            experience a smarter way to plan your journey with TripPilot AI.
          </p>
        </div>

        <HeroVisual />
      </section>

      <section className="wide-wrap" style={{ marginTop: 8 }}>
        <p className="eyebrow">Start with a city</p>
        <h2 className="page-title" style={{ fontSize: "32px" }}>
          
        </h2>
        <p className="lede">
          Pick a city, we convert it to a valid IATA code, then search live
          Duffel offers through your NestJS backend.
        </p>
        <FlightSearchForm
          onSearch={(values) =>
            router.push(`/flights?${flightSearchQuery(values)}`)
          }
        />
      </section>

      <section className="wide-wrap">
        <p className="eyebrow">Inspired routes</p>

        <h2 className="page-title" style={{ fontSize: "32px" }}>
          Destinations with a cinematic edge
        </h2>

        <div className="destination-grid">
          {destinations.map((item) => (
            <article key={item.city} className="destination-tile">
              {!failedImages[item.city] && (
                <Image
                  src={item.src}
                  alt={`${item.city} travel destination`}
                  fill
                  sizes="(max-width: 839px) 100vw, 33vw"
                  onError={() =>
                    setFailedImages((current) => ({
                      ...current,
                      [item.city]: true,
                    }))
                  }
                />
              )}

              <span>{item.city}</span>
            </article>
          ))}
        </div>

        <TravelChat />
      </section>
    </PageShell>
  );
}
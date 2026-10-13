"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BookingStepper from "@/components/BookingStepper";
import FlightCard from "@/components/FlightCard";
import FlightSearchForm from "@/components/FlightSearchForm";
import PageShell from "@/components/PageShell";
import { cityFromCode } from "@/lib/airports";
import { requireAuthPath, searchFlights } from "@/lib/api";
import { saveCheckout } from "@/lib/checkout";
import {
  airlineName,
  numericPrice,
  parseDurationMinutes,
  stopCount,
  type Flight,
  type FlightSearchValues,
} from "@/lib/flights";

function FlightsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialValues: FlightSearchValues = {
    origin: (searchParams.get("origin") || "DEL").toUpperCase(),
    destination: (searchParams.get("destination") || "BOM").toUpperCase(),
    departureDate: searchParams.get("departureDate") || "",
    returnDate: searchParams.get("returnDate") || "",
    passengers: searchParams.get("passengers") || "1",
  };

  const [origin, setOrigin] = useState(initialValues.origin);
  const [destination, setDestination] = useState(initialValues.destination);
  const [searchValues, setSearchValues] = useState(initialValues);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "duration" | "stops">("price");
  const [stopsFilter, setStopsFilter] = useState<"all" | "nonstop" | "stops">(
    "all",
  );
  const [airlineFilter, setAirlineFilter] = useState("all");

  const runSearch = useCallback(async (values: FlightSearchValues) => {
    setError("");
    setFlights([]);
    setSearched(false);
    setOrigin(values.origin);
    setDestination(values.destination);
    setSearchValues(values);

    try {
      setLoading(true);

      const payload: {
        origin: string;
        destination: string;
        departureDate: string;
        passengers: number;
        returnDate?: string;
      } = {
        origin: values.origin,
        destination: values.destination,
        departureDate: values.departureDate,
        passengers: Number(values.passengers),
      };

      if (values.returnDate) payload.returnDate = values.returnDate;

      const data = await searchFlights(payload);
      const record =
        data && typeof data === "object"
          ? (data as { offers?: unknown; flights?: unknown })
          : {};

      const offers: Flight[] = Array.isArray(data)
        ? (data as Flight[])
        : Array.isArray(record.offers)
          ? (record.offers as Flight[])
          : Array.isArray(record.flights)
            ? (record.flights as Flight[])
            : [];

      setFlights(offers);
      setSearched(true);

      if (offers.length === 0) {
        setError("No flights found. Try another route or date.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to search flights.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialValues.departureDate) return;
    const timer = window.setTimeout(() => {
      void runSearch(initialValues);
    }, 0);
    return () => window.clearTimeout(timer);
    // Search once from landing query params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const airlines = useMemo(() => {
    const names = new Set<string>();
    for (const flight of flights) {
      names.add(airlineName(flight.slices?.[0]?.segments?.[0]));
    }
    return [...names].sort();
  }, [flights]);

  const visibleFlights = useMemo(() => {
    const filtered = flights.filter((flight) => {
      const stops = stopCount(flight);
      if (stopsFilter === "nonstop" && stops !== 0) return false;
      if (stopsFilter === "stops" && stops === 0) return false;
      if (
        airlineFilter !== "all" &&
        airlineName(flight.slices?.[0]?.segments?.[0]) !== airlineFilter
      ) {
        return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "duration") {
        return (
          parseDurationMinutes(a.slices?.[0]?.duration) -
          parseDurationMinutes(b.slices?.[0]?.duration)
        );
      }
      if (sortBy === "stops") {
        return stopCount(a) - stopCount(b);
      }
      return numericPrice(a) - numericPrice(b);
    });
  }, [airlineFilter, flights, sortBy, stopsFilter]);

  function handleSelectFlight(flight: Flight) {
    saveCheckout({
      flight,
      origin: searchValues.origin,
      destination: searchValues.destination,
      originCity: cityFromCode(searchValues.origin, origin),
      destinationCity: cityFromCode(searchValues.destination, destination),
      departureDate: searchValues.departureDate,
      returnDate: searchValues.returnDate,
      passengers: searchValues.passengers,
    });

    router.push(requireAuthPath("/bookings/review"));
  }

  return (
    <PageShell>
      <div className="wide-wrap">
        <p className="eyebrow">Flight search</p>
        <h1 className="page-title">Find your next flight</h1>
        <p className="lede">
          Search by city, compare live Duffel offers, then continue to a
          dedicated review and simulated payment flow.
        </p>

        <BookingStepper current={searched ? "Results" : "Search"} />

        <FlightSearchForm
          key={searchParams.toString()}
          initialValues={initialValues}
          submitting={loading}
          onSearch={(values) => void runSearch(values)}
        />

        {loading && (
          <div className="loading-card surface-card" style={{ marginTop: 20 }}>
            Searching live flight offers...
          </div>
        )}

        {error && (
          <p role="alert" className="alert alert-error" style={{ marginTop: 16 }}>
            {error}
          </p>
        )}

        {searched && flights.length > 0 && (
          <section style={{ marginTop: 36 }}>
            <div className="heading-row">
              <div>
                <h2>Available flights</h2>
                <p className="lede">
                  Showing {visibleFlights.length} of {flights.length} live offers
                  from {cityFromCode(origin, origin)} to{" "}
                  {cityFromCode(destination, destination)}.
                </p>
              </div>
            </div>

            <div className="filter-bar">
              <label className="field">
                <span>Sort</span>
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as "price" | "duration" | "stops")
                  }
                >
                  <option value="price">Price</option>
                  <option value="duration">Duration</option>
                  <option value="stops">Stops</option>
                </select>
              </label>
              <label className="field">
                <span>Stops</span>
                <select
                  value={stopsFilter}
                  onChange={(event) =>
                    setStopsFilter(
                      event.target.value as "all" | "nonstop" | "stops",
                    )
                  }
                >
                  <option value="all">All flights</option>
                  <option value="nonstop">Non-stop</option>
                  <option value="stops">With stops</option>
                </select>
              </label>
              <label className="field">
                <span>Airline</span>
                <select
                  value={airlineFilter}
                  onChange={(event) => setAirlineFilter(event.target.value)}
                >
                  <option value="all">All airlines</option>
                  {airlines.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {visibleFlights.length === 0 && (
              <div className="empty-state surface-card">
                No offers match these filters. Try showing all flights.
              </div>
            )}

            <div className="stack">
              {visibleFlights.map((flight, index) => (
                <FlightCard
                  key={flight.id || index}
                  flight={flight}
                  index={index}
                  origin={origin}
                  destination={destination}
                  onSelect={() => handleSelectFlight(flight)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}

export default function FlightsPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <div className="wide-wrap">
            <div className="loading-card surface-card">Loading flight search...</div>
          </div>
        </PageShell>
      }
    >
      <FlightsPageContent />
    </Suspense>
  );
}

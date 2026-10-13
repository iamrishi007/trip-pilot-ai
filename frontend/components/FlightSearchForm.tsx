"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import CityAutocomplete from "@/components/CityAutocomplete";
import {
  airportLabel,
  findAirport,
  type AirportOption,
} from "@/lib/airports";
import { todayISODate, type FlightSearchValues } from "@/lib/flights";

type Props = {
  initialValues?: Partial<FlightSearchValues>;
  submitting?: boolean;
  submitLabel?: string;
  onSearch: (values: FlightSearchValues) => void;
};

function initialCity(value: string | undefined, fallbackCode: string) {
  const match = findAirport(value) || findAirport(fallbackCode);
  return match ? airportLabel(match) : fallbackCode;
}

export default function FlightSearchForm({
  initialValues,
  submitting = false,
  submitLabel = "Search flights",
  onSearch,
}: Props) {
  const [origin, setOrigin] = useState(
    initialCity(initialValues?.origin, "DEL"),
  );
  const [destination, setDestination] = useState(
    initialCity(initialValues?.destination, "BOM"),
  );
  const [departureDate, setDepartureDate] = useState(
    initialValues?.departureDate ?? "",
  );
  const [returnDate, setReturnDate] = useState(
    initialValues?.returnDate ?? "",
  );
  const [passengers, setPassengers] = useState(
    initialValues?.passengers ?? "1",
  );
  const [localError, setLocalError] = useState("");
  const [minDate, setMinDate] = useState("");

  const selectedOrigin = findAirport(origin);
  const selectedDestination = findAirport(destination);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMinDate(todayISODate());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function swapCities() {
    setOrigin(destination);
    setDestination(origin);
  }

  function handleSelect(kind: "origin" | "destination", airport: AirportOption) {
    const label = airportLabel(airport);
    if (kind === "origin") setOrigin(label);
    else setDestination(label);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");

    const from = findAirport(origin);
    const to = findAirport(destination);

    if (!from) {
      setLocalError(
        "Please select a supported departure city from the suggestions.",
      );
      return;
    }

    if (!to) {
      setLocalError(
        "Please select a supported destination city from the suggestions.",
      );
      return;
    }

    if (from.code === to.code) {
      setLocalError("Origin and destination must be different airports.");
      return;
    }

    if (!departureDate) {
      setLocalError("Please select a departure date.");
      return;
    }

    if (departureDate < todayISODate()) {
      setLocalError("Departure date cannot be in the past.");
      return;
    }

    if (returnDate && returnDate < departureDate) {
      setLocalError("Return date cannot be before departure.");
      return;
    }

    onSearch({
      origin: from.code,
      destination: to.code,
      departureDate,
      returnDate,
      passengers,
    });
  }

  return (
    <form className="search-card" onSubmit={handleSubmit} noValidate>
      <div className="search-grid">
        <CityAutocomplete
          id="origin"
          label="From"
          value={origin}
          selected={selectedOrigin}
          placeholder="Mumbai, Delhi, London..."
          onChange={setOrigin}
          onSelect={(airport) => handleSelect("origin", airport)}
        />

        <button
          type="button"
          className="swap-btn"
          onClick={swapCities}
          aria-label="Swap origin and destination"
        >
          ⇄
        </button>

        <CityAutocomplete
          id="destination"
          label="To"
          value={destination}
          selected={selectedDestination}
          placeholder="Where do you want to go?"
          onChange={setDestination}
          onSelect={(airport) => handleSelect("destination", airport)}
        />

        <label className="field">
          <span>Departure</span>
          <input
            id="departureDate"
            name="departureDate"
            type="date"
            required
            min={minDate || undefined}
            value={departureDate}
            onChange={(event) => {
              const nextDate = event.target.value;
              setDepartureDate(nextDate);
              if (returnDate && nextDate > returnDate) {
                setReturnDate("");
              }
            }}
          />
        </label>

        <label className="field">
          <span>Return (optional)</span>
          <input
            id="returnDate"
            name="returnDate"
            type="date"
            min={departureDate || minDate || undefined}
            value={returnDate}
            onChange={(event) => setReturnDate(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Passengers</span>
          <select
            id="passengers"
            name=""
            value={passengers}
            onChange={(event) => setPassengers(event.target.value)}
          >
            {[1, 2, 3, 4, 5, 6,7,8,9].map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {localError && (
        <p className="alert alert-error" role="alert">
          {localError}
        </p>
      )}

      <button
        className="btn btn-primary btn-block"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Searching flights..." : submitLabel}
      </button>
    </form>
  );
}

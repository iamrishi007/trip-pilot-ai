
export type Airport = {
  iata_code?: string;
  name?: string;
};

export type Segment = {
  departing_at?: string;
  arriving_at?: string;
  departure?: string;
  arrival?: string;
  origin?: Airport | string;
  destination?: Airport | string;
  marketing_carrier?: {
    name?: string;
    iata_code?: string;
  };
  airline?: string;
  marketing_carrier_flight_number?: string;
  flight_number?: string;
};

export type FlightSlice = {
  type?: string;
  origin?: Airport | string;
  destination?: Airport | string;
  duration?: string;
  segments?: Segment[];
};

export type Flight = {
  id: string;

  // Original price returned by Duffel.
  total_amount?: string | number | null;
  total_currency?: string | null;

  // Converted price returned by our backend.
  price_inr?: number | string | null;
  currency_inr?: string | null;

  // Other supported price formats.
  original_price?: string | number | null;
  original_currency?: string | null;
  price?: string | number | null;
  currency?: string | null;

  slices?: FlightSlice[];
};

export type FlightSearchValues = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: string;
};

export function airportCode(value?: Airport | string): string {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return value.iata_code || value.name || "—";
}

export function segmentDeparture(
  segment?: Segment,
): string | undefined {
  return segment?.departing_at || segment?.departure;
}

export function segmentArrival(
  segment?: Segment,
): string | undefined {
  return segment?.arriving_at || segment?.arrival;
}

/**
 * Return the INR price when the backend has converted it.
 * Otherwise, preserve the original provider price.
 */
export function flightPrice(
  flight: Flight,
): string | undefined {
  const rawPrice =
    flight.price_inr ??
    flight.total_amount ??
    flight.price ??
    flight.original_price;

  if (rawPrice === undefined || rawPrice === null || rawPrice === "") {
    return undefined;
  }

  const value = Number(rawPrice);

  return Number.isFinite(value) ? String(value) : undefined;
}

/**
 * Return the currency corresponding to the displayed price.
 */
export function flightCurrency(flight: Flight): string {
  if (flight.price_inr !== undefined && flight.price_inr !== null) {
    return "INR";
  }

  return (
    flight.total_currency ||
    flight.currency ||
    flight.original_currency ||
    ""
  );
}

/**
 * Format a flight price using Indian number formatting.
 */
export function formatFlightPrice(
  price: string | number,
  currency: string,
): string {
  const amount = Number(price);

  if (!Number.isFinite(amount)) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function airlineName(segment?: Segment): string {
  return (
    segment?.marketing_carrier?.name ||
    segment?.marketing_carrier?.iata_code ||
    segment?.airline ||
    "Airline"
  );
}

export function flightNumber(segment?: Segment): string {
  return (
    segment?.marketing_carrier_flight_number ||
    segment?.flight_number ||
    "—"
  );
}

export function formatTime(value?: string): string {
  if (!value) return "--:--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "--:--";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value?: string): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function segmentOrigin(
  segment?: Segment,
  slice?: FlightSlice,
): string {
  return airportCode(segment?.origin || slice?.origin);
}

export function segmentDestination(
  segment?: Segment,
  slice?: FlightSlice,
): string {
  return airportCode(segment?.destination || slice?.destination);
}

export function parseDurationMinutes(duration?: string): number {
  if (!duration) return Number.POSITIVE_INFINITY;

  const hours = duration.match(/(\d+)H/i);
  const minutes = duration.match(/(\d+)M/i);

  const h = hours ? Number(hours[1]) : 0;
  const m = minutes ? Number(minutes[1]) : 0;

  if (!hours && !minutes) return Number.POSITIVE_INFINITY;

  return h * 60 + m;
}

export function numericPrice(flight: Flight): number {
  const raw = flightPrice(flight);

  if (raw === undefined) return Number.POSITIVE_INFINITY;

  const value = Number(raw);

  return Number.isFinite(value)
    ? value
    : Number.POSITIVE_INFINITY;
}

export function stopCount(flight: Flight): number {
  const segments = flight.slices?.[0]?.segments?.length ?? 1;

  return Math.max(0, segments - 1);
}

export function todayISODate(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function formatDuration(duration?: string): string {
  const minutes = parseDurationMinutes(duration);

  if (!Number.isFinite(minutes)) {
    return duration || "Duration unavailable";
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;

  return `${hours}h ${rest}m`;
}

export function flightSearchQuery(
  values: FlightSearchValues,
): string {
  const params = new URLSearchParams({
    origin: values.origin,
    destination: values.destination,
    departureDate: values.departureDate,
    passengers: values.passengers,
  });

  if (values.returnDate) {
    params.set("returnDate", values.returnDate);
  }

  return params.toString();
}

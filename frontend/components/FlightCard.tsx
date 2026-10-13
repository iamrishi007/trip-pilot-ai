
import {
  airlineName,
  flightCurrency,
  flightNumber,
  flightPrice,
  formatDate,
  formatDuration,
  formatFlightPrice,
  formatTime,
  segmentArrival,
  segmentDeparture,
  segmentDestination,
  segmentOrigin,
  stopCount,
  type Flight,
} from "@/lib/flights";

export default function FlightCard({
  flight,
  index,
  origin,
  destination,
  selected,
  onSelect,
}: {
  flight: Flight;
  index: number;
  origin: string;
  destination: string;
  selected?: boolean;
  onSelect: () => void;
}) {
  const firstSlice = flight.slices?.[0];
  const firstSegment = firstSlice?.segments?.[0];

  const lastOutbound =
    firstSlice?.segments?.[
      (firstSlice.segments?.length ?? 1) - 1
    ];

  const airline = airlineName(firstSegment);

  const fromCode =
    segmentOrigin(firstSegment, firstSlice) || origin;

  const toCode =
    segmentDestination(lastOutbound, firstSlice) || destination;

  const price = flightPrice(flight);
  const currency = flightCurrency(flight) || "INR";
  const stops = stopCount(flight);
  const hasReturn = (flight.slices?.length ?? 0) > 1;

  return (
    <article
      className={`flight-card ${selected ? "is-selected" : ""}`}
    >
      <div className="flight-top">
        <div>
          <p className="font-semibold">{airline}</p>

          <p className="route-meta">
            {flightNumber(firstSegment)} · Offer {index + 1}
            {hasReturn ? " · Round trip" : " · One way"}
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <p className="price">
            {price !== undefined
              ? formatFlightPrice(price, currency)
              : "Price unavailable"}
          </p>

          <p className="route-meta">Total offer price</p>
        </div>
      </div>

      <div className="journey-times">
        <div>
          <p className="price">
            {formatTime(segmentDeparture(firstSegment))}
          </p>

          <p>{fromCode}</p>

          <p className="route-meta">
            {formatDate(segmentDeparture(firstSegment))}
          </p>
        </div>

        <div className="route-meta">
          <p>{formatDuration(firstSlice?.duration)}</p>

          <div className="route-line" />

          <p>
            {stops === 0
              ? "Non-stop"
              : `${stops} stop${stops === 1 ? "" : "s"}`}
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <p className="price">
            {formatTime(segmentArrival(lastOutbound))}
          </p>

          <p>{toCode}</p>

          <p className="route-meta">
            {formatDate(segmentArrival(lastOutbound))}
          </p>
        </div>
      </div>

      <div className="heading-row">
        <p className="route-meta">
          Live Duffel offer · {fromCode} → {toCode}
        </p>

        <button
          type="button"
          onClick={onSelect}
          className="btn btn-primary"
        >
          {selected ? "Selected" : "Select flight"}
        </button>
      </div>
    </article>
  );
}


import {
  airlineName,
  flightNumber,
  formatDate,
  formatTime,
  segmentArrival,
  segmentDeparture,
  segmentDestination,
  segmentOrigin,
  type FlightSlice,
} from "@/lib/flights";

export default function JourneyDetails({
  title,
  slice,
}: {
  title: string;
  slice?: FlightSlice;
}) {
  const segments = slice?.segments || [];
  const first = segments[0];
  const last = segments[segments.length - 1];

  if (!slice || segments.length === 0) {
    return (
      <div className="surface-card" style={{ padding: 16 }}>
        <p className="font-semibold">{title}</p>
        <p className="lede">Journey details are not available for this offer.</p>
      </div>
    );
  }

  return (
    <div className="surface-card" style={{ padding: 16 }}>
      <div className="heading-row">
        <p className="font-semibold">{title}</p>
        <p className="route-meta">
          {slice.duration || `${segments.length} segment(s)`}
        </p>
      </div>

      {segments.map((segment, index) => (
        <div key={`${flightNumber(segment)}-${index}`} className="journey-times">
          <div>
            <p className="text-sm" style={{ color: "var(--sky-300)" }}>
              {airlineName(segment)} · Flight {flightNumber(segment)}
            </p>
            <p className="price" style={{ fontSize: 22 }}>
              {formatTime(segmentDeparture(segment))}
            </p>
            <p>{segmentOrigin(segment, slice)}</p>
            <p className="route-meta">{formatDate(segmentDeparture(segment))}</p>
          </div>
          <div className="route-meta">
            <p>Segment {index + 1}</p>
            <div className="route-line" />
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="price" style={{ fontSize: 22 }}>
              {formatTime(segmentArrival(segment))}
            </p>
            <p>{segmentDestination(segment, slice)}</p>
            <p className="route-meta">{formatDate(segmentArrival(segment))}</p>
          </div>
        </div>
      ))}

      {first && last && segments.length > 1 && (
        <p className="route-meta">{segments.length - 1} connection(s)</p>
      )}
    </div>
  );
}

import { CalendarDays, CircleCheck, MapPin, Route } from "lucide-react";
import { displayDate } from "@/lib/trip-format";
import type { Trip } from "@/lib/trip-types";

export function TripRoute({ trip }: { trip: Pick<Trip, "origin" | "destination"> }) {
  return <span className="meta trip-route">
    <MapPin size={16} aria-hidden="true" />
    <span className="trip-route-places">
      {trip.origin && <span><b>From</b> {trip.origin}</span>}
      <span>{trip.origin && <b>To </b>}{trip.destination}</span>
    </span>
  </span>;
}

export function TripDates({ trip }: { trip: Pick<Trip, "starts" | "ends"> }) {
  const dates = [trip.starts, trip.ends].filter(Boolean);
  return dates.length > 0 && <span className="meta"><CalendarDays size={15} />{dates.map(displayDate).join(" – ")}</span>;
}

export function TripStatus({ endedAt }: { endedAt: Trip["endedAt"] }) {
  return <span className={`trip-status${endedAt ? " trip-status-ended" : ""}`}>
    {endedAt ? <CircleCheck size={14} aria-hidden="true" /> : <span className="trip-status-dot" />}
    {endedAt ? "Ended" : "Active"}
  </span>;
}

export function TripStops({ stops }: { stops: string[] }) {
  if (!stops.length) return null;
  return <section className="card trip-stops">
    <div className="card-heading"><Route size={18} aria-hidden="true" /><h2>Trip stops</h2></div>
    <ol>{stops.map((stop, index) => <li key={index}>
      <span className="stop-number" aria-hidden="true">{index + 1}</span>
      <span>{stop}</span>
    </li>)}</ol>
  </section>;
}

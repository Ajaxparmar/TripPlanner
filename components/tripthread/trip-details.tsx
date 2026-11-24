import { CalendarDays } from "lucide-react";
import { displayDate } from "@/lib/trip-format";
import type { Trip } from "@/lib/trip-types";

export function TripDates({ trip }: { trip: Pick<Trip, "starts" | "ends"> }) {
  const dates = [trip.starts, trip.ends].filter(Boolean);
  return dates.length > 0 && <span className="meta"><CalendarDays size={15} />{dates.map(displayDate).join(" – ")}</span>;
}

import { Suspense } from "react";
import { TripRoomPage } from "@/components/tripthread/trip-room";

export default function Room() {
  return <Suspense fallback={<p role="status">Loading trip…</p>}><TripRoomPage /></Suspense>;
}

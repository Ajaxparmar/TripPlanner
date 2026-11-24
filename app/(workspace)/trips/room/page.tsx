import { Suspense } from "react";
import { TripRoomPage } from "@/components/tripthread/trip-room";
import { Workspace } from "@/components/tripthread/workspace";

export default function Room() {
  return <Workspace>
    <Suspense fallback={<p role="status">Loading trip…</p>}><TripRoomPage /></Suspense>
  </Workspace>;
}

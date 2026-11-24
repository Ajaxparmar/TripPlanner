import { Suspense } from "react";
import { JoinTrip } from "@/components/tripthread/join-trip";

export default function Join() {
  return <Suspense fallback={<p role="status">Opening invite…</p>}><JoinTrip /></Suspense>;
}

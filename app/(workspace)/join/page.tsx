import { Suspense } from "react";
import { JoinTrip } from "@/components/tripthread/join-trip";
import { Workspace } from "@/components/tripthread/workspace";

export default function Join() {
  return <Workspace>
    <Suspense fallback={<p role="status">Opening invite…</p>}><JoinTrip /></Suspense>
  </Workspace>;
}

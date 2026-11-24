"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, errorMessage } from "@/lib/trip-client";
import { tripRoomPath } from "@/lib/trip-routes";
import { ErrorMessage } from "./status";

export function JoinTrip() {
  const router = useRouter();
  const invite = useSearchParams().get("invite") ?? "";
  const [failure, setFailure] = useState<{ invite: string; message: string }>();
  const error = !invite ? "This invite link is missing its code." : failure?.invite === invite ? failure.message : "";

  useEffect(() => {
    if (!invite) return;
    let live = true;
    api<{ id: string }>("join", { invite }).then(({ id }) => {
      if (live) router.replace(tripRoomPath(id));
    }).catch((error) => {
      if (live) setFailure({ invite, message: errorMessage(error) });
    });
    return () => { live = false; };
  }, [invite, router]);

  return <section className="empty">
    <h1>{error ? "Could not join the trip" : "Joining your trip…"}</h1>
    <ErrorMessage message={error} />
    {error && <Link className="button secondary" href="/trips">My trips</Link>}
  </section>;
}

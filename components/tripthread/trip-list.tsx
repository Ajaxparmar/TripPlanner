"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, MapPin, Mountain, Plus, Users } from "lucide-react";
import { api, useRemoteData, useSubmission } from "@/lib/trip-client";
import { money } from "@/lib/trip-format";
import { tripRoomPath } from "@/lib/trip-routes";
import type { TripSummary } from "@/lib/trip-types";
import { Dialog } from "./dialog";
import { ErrorMessage } from "./status";
import { TripDates } from "./trip-details";

function StartTrip({ close }: { close: () => void }) {
  const router = useRouter();
  const { busy, error, submit } = useSubmission();
  return <Dialog title="Start a trip" subtitle="Create a room for your group." close={() => { if (!busy) close(); }}>
    <form className="form" onSubmit={(event) => submit(event, async (values) => {
      const { id } = await api<{ id: string }>("trips", values);
      router.push(tripRoomPath(id));
      close();
    })}>
      <label>Trip name<input name="name" placeholder="e.g. Goa with friends" maxLength={100} required /></label>
      <label>Destination<input name="destination" placeholder="e.g. Goa, India" maxLength={100} required /></label>
      <div className="form-grid">
        <label>Start date<input name="starts" type="date" /></label>
        <label>End date<input name="ends" type="date" /></label>
      </div>
      <ErrorMessage message={error} />
      <button className="button primary" disabled={busy}>{busy ? "Creating…" : "Create trip room"}</button>
    </form>
  </Dialog>;
}

export function TripList() {
  const [creating, setCreating] = useState(false);
  const { data, error } = useRemoteData<{ trips: TripSummary[] }>("trips");
  return <>
    <section className="dashboard-intro">
      <div>
        <h1>My trips</h1>
        <p>Keep your plans and shared expenses together.</p>
        <button className="button light" onClick={() => setCreating(true)}><Plus size={19} /> Start a trip</button>
      </div>
    </section>
    <ErrorMessage message={error} banner />
    {data?.trips.length ? <section className="trip-grid" aria-label="Your trip rooms">
      {data.trips.map((trip) => <Link className="trip-tile" key={trip.id} href={tripRoomPath(trip.id)}>
        <span className="tile-icon"><Mountain size={22} /></span>
        <strong>{trip.name}</strong>
        <span className="meta"><MapPin size={15} />{trip.destination}</span>
        <TripDates trip={trip} />
        <span className="tile-bottom">
          <span className="meta"><Users size={16} />{trip.memberCount} {trip.memberCount === 1 ? "member" : "members"}</span>
          <b>{money(trip.total)}</b>
        </span>
      </Link>)}
    </section> : !error && <div className="empty dashboard-empty">
      <div className="empty-icon"><Compass size={25} /></div>
      <h2>{data ? "Your first trip starts here" : "Loading your trips…"}</h2>
      {data && <p>Create a room, then share the invite link with your friends.</p>}
    </div>}
    {creating && <StartTrip close={() => setCreating(false)} />}
  </>;
}

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Mountain, Plus, Route, Users, X } from "lucide-react";
import { api, useRemoteData, useSubmission } from "@/lib/trip-client";
import { money } from "@/lib/trip-format";
import { tripRoomPath } from "@/lib/trip-routes";
import { maxStopLength, maxTripStops, type TripSummary } from "@/lib/trip-types";
import { AmountInput } from "./amount-input";
import { Dialog } from "./dialog";
import { ErrorMessage } from "./status";
import { TripDates, TripRoute, TripStatus } from "./trip-details";

function StartTrip({ close }: { close: () => void }) {
  const router = useRouter();
  const { busy, error, submit } = useSubmission();
  const [stops, setStops] = useState<{ id: number; name: string }[]>([]);
  const nextStop = useRef(0);
  return <Dialog title="Start a trip" subtitle="Choose where you’ll start and where you’re headed." close={() => { if (!busy) close(); }}>
    <form className="form trip-form" onSubmit={(event) => submit(event, async (values) => {
      const { id } = await api<{ id: string }>("trips", { ...values, stops: stops.map(({ name }) => name.trim()).filter(Boolean) });
      router.push(tripRoomPath(id));
      close();
    })}>
      <label>Trip name<input name="name" placeholder="e.g. Goa with friends" maxLength={100} required /></label>
      <div className="form-grid">
        <label>From<input name="origin" placeholder="e.g. Mumbai" maxLength={100} required /></label>
        <label>To<input name="destination" placeholder="e.g. Goa" maxLength={100} required /></label>
      </div>
      <div className="form-grid">
        <label>Start date<input name="starts" type="date" /></label>
        <label>End date<input name="ends" type="date" /></label>
      </div>
      <fieldset className="stop-editor" disabled={busy}>
        <legend><Route size={16} aria-hidden="true" /> Stops <span className="optional">Optional</span></legend>
        {stops.map((stop, index) => <div className="stop-field" key={stop.id}>
          <label>
            <span className="stop-number" aria-hidden="true">{index + 1}</span>
            <input aria-label={`Stop ${index + 1}`} value={stop.name} maxLength={maxStopLength} placeholder="e.g. Fort Aguada"
              onChange={(event) => {
                const name = event.currentTarget.value;
                setStops((items) => items.map((item) => item.id === stop.id ? { ...item, name } : item));
              }} />
          </label>
          <button type="button" className="icon-button" aria-label={`Remove stop ${index + 1}`}
            onClick={() => setStops((items) => items.filter((item) => item.id !== stop.id))}><X size={17} /></button>
        </div>)}
        {stops.length < maxTripStops && <button type="button" className="add-stop"
          onClick={() => {
            const id = nextStop.current++;
            setStops((items) => [...items, { id, name: "" }]);
          }}><Plus size={16} /> Add a stop</button>}
      </fieldset>
      <AmountInput name="initialBudget" label="Your starting contribution (₹)" optional />
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
        <span className="tile-top">
          <span className="tile-icon"><Mountain size={22} /></span>
          <TripStatus endedAt={trip.endedAt} />
        </span>
        <strong>{trip.name}</strong>
        <TripRoute trip={trip} />
        <TripDates trip={trip} />
        {trip.stops.length > 0 && <span className="meta"><Route size={15} />{trip.stops.length} {trip.stops.length === 1 ? "stop" : "stops"}</span>}
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

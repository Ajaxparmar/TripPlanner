"use client";

import { useState } from "react";
import { Link2, MessageCircle } from "lucide-react";
import { api, useSubmission } from "@/lib/trip-client";
import { money, today } from "@/lib/trip-format";
import { joinPath } from "@/lib/trip-routes";
import { categories, type Room } from "@/lib/trip-types";
import { AmountInput } from "./amount-input";
import { Dialog } from "./dialog";
import { ErrorMessage } from "./status";

export function InviteDialog({ trip, close, copied }: { trip: Room["trip"]; close: () => void; copied: () => void }) {
  const [error, setError] = useState("");
  const inviteUrl = new URL(joinPath(trip.invite), window.location.origin).href;
  const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent(`Join “${trip.name}” on Tripthread!\n${inviteUrl}`);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      copied();
      close();
    } catch {
      setError("Select the invite link and copy it manually.");
    }
  }

  return <Dialog title="Invite friends" subtitle="Anyone with this link can join after signing in." close={close}>
    <div className="form">
      <label>Invite link<input value={inviteUrl} readOnly onFocus={(event) => event.currentTarget.select()} /></label>
      {local && <p className="muted">Open Tripthread at a shared address before sending this invite to friends.</p>}
      <a className="button primary" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
        <MessageCircle size={18} aria-hidden="true" /> Share on WhatsApp
      </a>
      <button className="button secondary" onClick={copyInvite}><Link2 size={18} /> Copy invite link</button>
      <ErrorMessage message={error} />
    </div>
  </Dialog>;
}

export function EndTripDialog({ tripId, close, ended }: { tripId: string; close: () => void; ended: (date: string) => void }) {
  const { busy, error, submit } = useSubmission();
  return <Dialog title="End this trip?" subtitle="Ending the trip closes invites, contributions, and expense entry. Tripmates can still see the ledger and settlements." close={() => { if (!busy) close(); }}>
    <form className="form" onSubmit={(event) => submit(event, async () => {
      const { endedAt } = await api<{ endedAt: string }>("end-trip", { trip: tripId });
      ended(endedAt);
      close();
    })}>
      <ErrorMessage message={error} />
      <div className="end-trip-actions">
        <button type="button" className="button secondary" disabled={busy} onClick={close}>Cancel</button>
        <button className="button end-trip-confirm" disabled={busy}>{busy ? "Ending…" : "End trip"}</button>
      </div>
    </form>
  </Dialog>;
}

export function ContributionDialog({ room, userId, close, saved }: { room: Room; userId: string; close: () => void; saved: () => void }) {
  const { busy, error, submit } = useSubmission();
  return <Dialog title="Add budget contribution" subtitle="Record money a tripmate put into the shared budget." close={() => { if (!busy) close(); }}>
    <form className="form" onSubmit={(event) => submit(event, async (values) => {
      await api("budget", { ...values, trip: room.trip.id });
      saved();
      close();
    })}>
      <label>Contributed by<select name="member" defaultValue={userId}>
        {room.members.map((member) => <option key={member.id} value={member.id}>{member.name}{member.id === userId ? " (you)" : ""}</option>)}
      </select></label>
      <AmountInput />
      <ErrorMessage message={error} />
      <button className="button primary" disabled={busy}>{busy ? "Saving…" : "Save contribution"}</button>
    </form>
  </Dialog>;
}

export function ExpenseDialog({ room, userId, close, saved }: { room: Room; userId: string; close: () => void; saved: () => void }) {
  const { busy, error, submit } = useSubmission();
  return <Dialog title="Add an expense" subtitle="Record who spent the money and what it was for." close={() => { if (!busy) close(); }}>
    <form className="form" onSubmit={(event) => submit(event, async (values) => {
      await api("expenses", { ...values, trip: room.trip.id });
      saved();
      close();
    })}>
      <label>What for<input name="title" placeholder="e.g. Dinner by the beach" maxLength={120} required /></label>
      <label>Where <span className="optional">Optional</span><input name="location" placeholder="e.g. Panaji, Goa" maxLength={120} /></label>
      <div className="form-grid">
        <AmountInput />
        <label>Category<select name="category">{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
      </div>
      <div className="form-grid">
        <label>Spent by<select name="payer" defaultValue={userId}>
          {room.members.map((member) => <option key={member.id} value={member.id}>{member.name}{member.id === userId ? " (you)" : ""}</option>)}
        </select></label>
        <label>Date<input name="spentOn" type="date" defaultValue={today()} required /></label>
      </div>
      <label>Paid from<select name="funding" defaultValue="personal">
        <option value="personal">Personal funds</option>
        <option value="budget" disabled={room.budget.remaining <= 0}>Group budget ({money(room.budget.remaining)} left)</option>
      </select></label>
      <ErrorMessage message={error} />
      <button className="button primary" disabled={busy}>{busy ? "Saving…" : "Save expense"}</button>
    </form>
  </Dialog>;
}

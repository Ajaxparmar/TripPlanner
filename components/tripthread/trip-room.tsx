"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Flag, Link2, Plus } from "lucide-react";
import { useRemoteData } from "@/lib/trip-client";
import type { Room } from "@/lib/trip-types";
import { TripBudget } from "./budget";
import { ExpenseLedger } from "./expense-ledger";
import { ContributionDialog, EndTripDialog, ExpenseDialog, InviteDialog } from "./room-dialogs";
import { useSession } from "./session";
import { Settlements, TripTotals } from "./settlement";
import { ErrorMessage, Notice } from "./status";
import { TripDates, TripRoute, TripStatus, TripStops } from "./trip-details";

export function TripRoomPage() {
  const tripId = useSearchParams().get("trip");
  const { user } = useSession();
  return <>
    <Link className="back-button" href="/trips">My trips</Link>
    {tripId && user ? <TripRoom key={tripId} tripId={tripId} userId={user.id} /> : <ErrorMessage message="Trip room not found." banner />}
  </>;
}

function TripRoom({ tripId, userId }: { tripId: string; userId: string }) {
  const { data: room, error, refresh } = useRemoteData<Room>("room?trip=" + encodeURIComponent(tripId), 5000);
  const [dialog, setDialog] = useState<"invite" | "expense" | "budget" | "end" | null>(null);
  const [closedAt, setClosedAt] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!room) return error ? <ErrorMessage message={error} banner /> : <p role="status">Loading trip…</p>;
  const member = room.members.find(({ id }) => id === userId);
  const endedAt = closedAt ?? room.trip.endedAt;
  const canEnd = room.trip.ownerId === userId && !endedAt;
  return <>
    <ErrorMessage message={error} banner />
    <section className="room-heading">
      <div>
        <TripStatus endedAt={endedAt} />
        <h1>{room.trip.name}</h1>
        <div className="room-meta">
          <TripRoute trip={room.trip} />
          <TripDates trip={room.trip} />
          {endedAt && <span className="meta">Ended {new Date(endedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
        </div>
      </div>
      {!endedAt && <div className="room-actions">
        {canEnd && <button className="button end-trip-button" onClick={() => setDialog("end")}><Flag size={16} /> End trip</button>}
        <button className="button secondary" onClick={() => setDialog("invite")}><Link2 size={17} /> Invite friends</button>
        <button className="button primary" onClick={() => setDialog("expense")}><Plus size={19} /> Add expense</button>
      </div>}
    </section>
    {member && <TripTotals total={room.total} member={member} />}
    <TripBudget budget={room.budget} members={room.members} onAdd={canEnd ? () => setDialog("budget") : undefined} />
    <TripStops stops={room.trip.stops} />
    <div className="room-grid">
      <Settlements room={room} userId={userId} />
      <ExpenseLedger expenses={room.expenses} />
    </div>
    {!endedAt && dialog === "invite" && <InviteDialog trip={room.trip} close={() => setDialog(null)} copied={() => setNotice("Invite link copied.")} />}
    {!endedAt && dialog === "expense" && <ExpenseDialog room={room} userId={userId} close={() => setDialog(null)} saved={() => {
      refresh();
      setNotice("Expense added.");
    }} />}
    {canEnd && dialog === "budget" && <ContributionDialog room={room} userId={userId} close={() => setDialog(null)} saved={() => {
      refresh();
      setNotice("Contribution added.");
    }} />}
    {canEnd && dialog === "end" && <EndTripDialog tripId={tripId} close={() => setDialog(null)} ended={(date) => {
      setClosedAt(date);
      refresh();
      setNotice("Trip ended.");
    }} />}
    <Notice message={notice} />
  </>;
}

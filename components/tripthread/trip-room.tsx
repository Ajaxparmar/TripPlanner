"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Link2, MapPin, Plus } from "lucide-react";
import { useRemoteData } from "@/lib/trip-client";
import type { Room } from "@/lib/trip-types";
import { ExpenseLedger } from "./expense-ledger";
import { ExpenseDialog, InviteDialog } from "./room-dialogs";
import { useSession } from "./session";
import { Settlements, TripTotals } from "./settlement";
import { ErrorMessage, Notice } from "./status";
import { TripDates } from "./trip-details";

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
  const [dialog, setDialog] = useState<"invite" | "expense" | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!room) return error ? <ErrorMessage message={error} banner /> : <p role="status">Loading trip…</p>;
  const member = room.members.find(({ id }) => id === userId);
  return <>
    <ErrorMessage message={error} banner />
    <section className="room-heading">
      <div>
        <h1>{room.trip.name}</h1>
        <div className="room-meta">
          <span className="meta"><MapPin size={16} />{room.trip.destination}</span>
          <TripDates trip={room.trip} />
        </div>
      </div>
      <div className="room-actions">
        <button className="button secondary" onClick={() => setDialog("invite")}><Link2 size={17} /> Invite friends</button>
        <button className="button primary" onClick={() => setDialog("expense")}><Plus size={19} /> Add expense</button>
      </div>
    </section>
    {member && <TripTotals total={room.total} member={member} />}
    <div className="room-grid">
      <Settlements room={room} userId={userId} />
      <ExpenseLedger expenses={room.expenses} />
    </div>
    {dialog === "invite" && <InviteDialog trip={room.trip} close={() => setDialog(null)} copied={() => setNotice("Invite link copied.")} />}
    {dialog === "expense" && <ExpenseDialog room={room} userId={userId} close={() => setDialog(null)} saved={() => {
      refresh();
      setNotice("Expense added.");
    }} />}
    <Notice message={notice} />
  </>;
}

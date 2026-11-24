import { ArrowDownLeft, ArrowUpRight, CircleCheck, ReceiptIndianRupee, Wallet } from "lucide-react";
import { money } from "@/lib/trip-format";
import type { Contribution, Room } from "@/lib/trip-types";
import { Avatar } from "./profile-photo";

function balanceLabel(balance: number, personal = false) {
  if (!balance) return personal ? "Your balance" : "Settled";
  if (personal) return balance > 0 ? "You’re owed" : "You owe";
  return balance > 0 ? "Gets back" : "Owes";
}

export function TripTotals({ total, member }: { total: number; member: Contribution }) {
  const BalanceIcon = member.balance < 0 ? ArrowUpRight : ArrowDownLeft;
  return <div className="stats">
    <div className="stat"><span className="stat-icon"><Wallet size={19} /></span><div><span>Total spending</span><strong>{money(total)}</strong></div></div>
    <div className="stat"><span className="stat-icon"><ReceiptIndianRupee size={20} /></span><div><span>Your share</span><strong>{money(member.share)}</strong></div></div>
    <div className="stat"><span className="stat-icon"><BalanceIcon size={19} /></span><div><span>{balanceLabel(member.balance, true)}</span><strong>{money(Math.abs(member.balance))}</strong></div></div>
  </div>;
}

export function Settlements({ room, userId }: { room: Room; userId: string }) {
  const names = new Map(room.members.map((member) => [member.id, member.name]));
  const title = (id: string) => id === userId ? `${names.get(id)} (you)` : names.get(id);
  return <div className="settlement-panels">
    <section className="card">
      <div className="card-heading"><h2>Who pays whom</h2></div>
      {room.payments.length ? <ul className="payment-list">{room.payments.map((payment) => <li key={payment.fromId + ":" + payment.toId}>
        <span><strong>{title(payment.fromId)}</strong> pays <strong>{title(payment.toId)}</strong></span>
        <strong className="payment-amount">{money(payment.amount)}</strong>
      </li>)}</ul> : <p className="settled"><CircleCheck size={18} />{room.total ? "Everyone has paid their share." : "Suggested payments will appear here after you add expenses."}</p>}
    </section>
    <section className="card">
      <div className="card-heading"><h2>Tripmates</h2><span className="count">{room.members.length}</span></div>
      <p className="split-explanation muted">The total is split equally across current tripmates. Rounding can make shares differ by one paisa.</p>
      <ul className="contributions">{room.members.map((member) => <li key={member.id}>
        <div className="contribution-person">
          <Avatar person={member} />
          <div className="member-name"><strong>{member.name}</strong>
            <span>{member.id === userId ? "You" : member.id === room.trip.ownerId ? "Trip organizer" : "Member"}</span>
          </div>
        </div>
        <dl className="contribution-values">
          <div><dt>Paid</dt><dd>{money(member.paid)}</dd></div>
          <div><dt>Share</dt><dd>{money(member.share)}</dd></div>
          <div className={member.balance < 0 ? "balance-owes" : "balance-positive"}>
            <dt>{balanceLabel(member.balance)}</dt><dd>{money(Math.abs(member.balance))}</dd>
          </div>
        </dl>
      </li>)}</ul>
    </section>
  </div>;
}

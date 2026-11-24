import { ArrowDownLeft, ArrowUpRight, CircleCheck, ReceiptIndianRupee, Wallet } from "lucide-react";
import { money } from "@/lib/trip-format";
import { groupBudgetId, type Contribution, type Room } from "@/lib/trip-types";
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
      <div className="card-heading"><h2>Trip members</h2><span className="count">{room.members.length}</span></div>
      <p className="split-explanation muted">The total is split equally across current tripmates. Rounding can make shares differ by one paisa.</p>
      <ul className="contributions">{room.members.map((member) => <li key={member.id}>
        <div className="contribution-person">
          <Avatar person={member} />
          <div className="member-name"><strong>{member.name}</strong>
            <span>{member.id === room.trip.ownerId ? "Organizer" : "Member"}{member.id === userId && " · You"}</span>
          </div>
          <div className="member-spending">
            <span>Spent</span>
            <strong>{money(member.spent)}</strong>
            {member.spentFromBudget > 0 && <span>{money(member.spentFromBudget)} from budget</span>}
          </div>
        </div>
        <dl className="contribution-values">
          <div><dt>Total paid</dt><dd>{money(member.paid)}
            {member.deposited > 0 && <small>{money(member.deposited)} to budget</small>}
          </dd></div>
          <div><dt>Share</dt><dd>{money(member.share)}</dd></div>
          <div className={member.balance < 0 ? "balance-owes" : "balance-positive"}>
            <dt>{balanceLabel(member.balance)}</dt><dd>{money(Math.abs(member.balance))}</dd>
          </div>
        </dl>
      </li>)}</ul>
    </section>
    <section className="card">
      <div className="card-heading"><h2>Who pays whom</h2></div>
      {room.payments.length ? <ul className="payment-list">{room.payments.map((payment) => <li key={payment.fromId + ":" + payment.toId}>
        {payment.fromId === groupBudgetId
          ? <span><strong>Group budget</strong> refunds <strong>{title(payment.toId)}</strong></span>
          : <span><strong>{title(payment.fromId)}</strong> pays <strong>{title(payment.toId)}</strong></span>}
        <strong className="payment-amount">{money(payment.amount)}</strong>
      </li>)}</ul> : <p className="settled"><CircleCheck size={18} />{room.total ? "Everyone has paid their share." : "Suggested payments will appear here after you add expenses."}</p>}
    </section>
  </div>;
}

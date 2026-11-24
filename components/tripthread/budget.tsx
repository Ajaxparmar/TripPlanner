import { Plus, Wallet } from "lucide-react";
import { money } from "@/lib/trip-format";
import type { Room } from "@/lib/trip-types";

export function TripBudget({ budget, members, onAdd }: {
  budget: Room["budget"];
  members: Room["members"];
  onAdd?: () => void;
}) {
  const names = new Map(members.map((member) => [member.id, member.name]));
  return <section className="card trip-budget">
    <div className="card-heading">
      <Wallet size={18} aria-hidden="true" />
      <h2>Group budget</h2>
      {onAdd && <button type="button" className="button secondary budget-add" onClick={onAdd}><Plus size={16} /> Add contribution</button>}
    </div>
    <dl className="budget-totals">
      <div><dt>Collected</dt><dd>{money(budget.added)}</dd></div>
      <div><dt>Spent from budget</dt><dd>{money(budget.used)}</dd></div>
      <div className="budget-remaining"><dt>Remaining</dt><dd>{money(budget.remaining)}</dd></div>
    </dl>
    {budget.deposits.length > 0 && <details className="budget-history">
      <summary>Contribution history</summary>
      <ul aria-label="Budget contributions">
        {budget.deposits.map((deposit) => <li key={deposit.id}>
          <span>{names.get(deposit.memberId) ?? "Trip member"}</span><strong>{money(deposit.amount)}</strong>
        </li>)}
      </ul>
    </details>}
  </section>;
}

import { Car, Compass, Hotel, ReceiptText, Utensils } from "lucide-react";
import { displayDate, money } from "@/lib/trip-format";
import type { Expense } from "@/lib/trip-types";

const categoryIcons = new Map([
  ["Food", Utensils], ["Transport", Car], ["Stay", Hotel], ["Activities", Compass], ["Other", ReceiptText],
]);

export function ExpenseLedger({ expenses }: { expenses: Expense[] }) {
  return <section className="card expense-ledger">
    <div className="card-heading"><h2>Expenses</h2><span className="count">{expenses.length}</span></div>
    {expenses.length ? <ul className="ledger">{expenses.map((expense) => {
      const Icon = categoryIcons.get(expense.category) ?? ReceiptText;
      return <li key={expense.id}>
        <span className={`category-icon category-${expense.category.toLowerCase()}`}><Icon size={19} /></span>
        <div className="ledger-detail">
          <strong>{expense.title}</strong>
          <span>{expense.category} · {expense.location && `${expense.location} · `}{displayDate(expense.spentOn)}</span>
          <span>{expense.fromBudget ? `Spent by ${expense.payer} · Group budget` : `Paid by ${expense.payer} · Personal funds`}</span>
        </div>
        <div className="ledger-amount"><strong>{money(expense.amount)}</strong></div>
      </li>;
    })}</ul> : <div className="empty">
      <div className="empty-icon"><ReceiptText size={24} /></div><h3>No expenses yet</h3>
      <p>Add the first payment to start tracking what everyone spends.</p>
    </div>}
  </section>;
}

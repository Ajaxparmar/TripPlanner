import { groupBudgetId, type BudgetDeposit, type Contribution, type Payment, type Tripmate } from "./trip-types";

type Spending = { payerId: string; amount: number; fromBudget?: boolean };

export function calculateSettlement(tripmates: Tripmate[], expenses: Spending[], deposits: BudgetDeposit[] = []) {
  const paidByMember = new Map<string, number>();
  const budgetSpendingByMember = new Map<string, number>();
  const depositedByMember = new Map<string, number>();
  let added = 0;
  for (const { memberId, amount } of deposits) {
    added += amount;
    depositedByMember.set(memberId, (depositedByMember.get(memberId) ?? 0) + amount);
  }
  let total = 0;
  let used = 0;
  for (const { payerId, amount, fromBudget } of expenses) {
    total += amount;
    if (fromBudget) {
      used += amount;
      budgetSpendingByMember.set(payerId, (budgetSpendingByMember.get(payerId) ?? 0) + amount);
    } else {
      paidByMember.set(payerId, (paidByMember.get(payerId) ?? 0) + amount);
    }
  }
  const remaining = added - used;

  const memberIds = tripmates.map(({ id }) => id).sort();
  const baseShare = memberIds.length ? Math.floor(total / memberIds.length) : 0;
  const remainder = total - baseShare * memberIds.length;
  // Assign spare paise in stable ID order so the shares always add up to the ledger total.
  const extraPaise = new Set(memberIds.slice(0, remainder));
  const members: Contribution[] = tripmates.map((member) => {
    const deposited = depositedByMember.get(member.id) ?? 0;
    const paidPersonally = paidByMember.get(member.id) ?? 0;
    const spentFromBudget = budgetSpendingByMember.get(member.id) ?? 0;
    const paid = paidPersonally + deposited;
    const spent = paidPersonally + spentFromBudget;
    const share = baseShare + Number(extraPaise.has(member.id));
    return { ...member, paid, deposited, spent, spentFromBudget, share, balance: paid - share };
  });

  const debtors = members.filter(({ balance }) => balance < 0)
    .map(({ id, balance }) => ({ id, remaining: -balance }))
    .sort((a, b) => b.remaining - a.remaining || a.id.localeCompare(b.id));
  // Return unspent cash from the pool before suggesting transfers between friends.
  if (remaining > 0) debtors.unshift({ id: groupBudgetId, remaining });
  const creditors = members.filter(({ balance }) => balance > 0)
    .map(({ id, balance }) => ({ id, remaining: balance }))
    .sort((a, b) => b.remaining - a.remaining || a.id.localeCompare(b.id));

  const payments: Payment[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.remaining, creditor.remaining);
    payments.push({ fromId: debtor.id, toId: creditor.id, amount });
    debtor.remaining -= amount;
    creditor.remaining -= amount;
    if (!debtor.remaining) debtorIndex++;
    if (!creditor.remaining) creditorIndex++;
  }

  return { members, payments, total, budget: { deposits, added, used, remaining } };
}

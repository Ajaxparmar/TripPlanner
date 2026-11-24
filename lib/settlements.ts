import type { Contribution, Payment, Tripmate } from "./trip-types";

type Spending = { payerId: string; amount: number };

export function calculateSettlement(tripmates: Tripmate[], expenses: Spending[]) {
  const paidByMember = new Map<string, number>();
  let total = 0;
  for (const { payerId, amount } of expenses) {
    total += amount;
    paidByMember.set(payerId, (paidByMember.get(payerId) ?? 0) + amount);
  }

  const memberIds = tripmates.map(({ id }) => id).sort();
  const baseShare = memberIds.length ? Math.floor(total / memberIds.length) : 0;
  const remainder = total - baseShare * memberIds.length;
  // Assign spare paise in stable ID order so the shares always add up to the ledger total.
  const extraPaise = new Set(memberIds.slice(0, remainder));
  const members: Contribution[] = tripmates.map((member) => {
    const paid = paidByMember.get(member.id) ?? 0;
    const share = baseShare + Number(extraPaise.has(member.id));
    return { ...member, paid, share, balance: paid - share };
  });

  const debtors = members.filter(({ balance }) => balance < 0)
    .map(({ id, balance }) => ({ id, remaining: -balance }))
    .sort((a, b) => b.remaining - a.remaining || a.id.localeCompare(b.id));
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

  return { members, payments, total };
}

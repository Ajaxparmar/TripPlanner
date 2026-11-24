export const categories = ["Food", "Transport", "Stay", "Activities", "Other"] as const;
export const maxTripStops = 12;
export const maxStopLength = 100;
export const groupBudgetId = "group-budget";

export type User = {
  id: string;
  name: string;
  email: string;
  photo: string;
  city: string;
  bio: string;
};

export type Trip = {
  id: string;
  name: string;
  origin: string | null;
  destination: string;
  starts: string;
  ends: string;
  stops: string[];
  endedAt: string | null;
};

export type TripSummary = Trip & { memberCount: number; total: number };
export type Tripmate = Pick<User, "id" | "name" | "photo">;

export type Contribution = Tripmate & {
  paid: number;
  deposited: number;
  spent: number;
  spentFromBudget: number;
  share: number;
  balance: number;
};

export type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  spentOn: string;
  payer: string;
  payerId: string;
  location: string | null;
  fromBudget: boolean;
};

export type Payment = { fromId: string; toId: string; amount: number };
export type BudgetDeposit = { id: string; memberId: string; amount: number };
export type Budget = { deposits: BudgetDeposit[]; added: number; used: number; remaining: number };

export type Room = {
  trip: Trip & { invite: string; ownerId: string };
  members: Contribution[];
  expenses: Expense[];
  payments: Payment[];
  budget: Budget;
  total: number;
};

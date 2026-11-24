export const categories = ["Food", "Transport", "Stay", "Activities", "Other"] as const;

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
  destination: string;
  starts: string;
  ends: string;
};

export type TripSummary = Trip & { memberCount: number; total: number };
export type Tripmate = Pick<User, "id" | "name" | "photo">;

export type Contribution = Tripmate & {
  paid: number;
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
};

export type Payment = { fromId: string; toId: string; amount: number };

export type Room = {
  trip: Trip & { invite: string; ownerId: string };
  members: Contribution[];
  expenses: Expense[];
  payments: Payment[];
  total: number;
};

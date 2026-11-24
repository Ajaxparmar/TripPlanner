import type { PrismaClient } from "@prisma/client";
import { calculateSettlement } from "../lib/settlements";
import { categories, type Room, type TripSummary } from "../lib/trip-types";
import { randomToken } from "./accounts";
import { dateField, isUniqueConflict, RequestError, stringField, type RequestBody } from "./request";

const tripDetails = { id: true, name: true, destination: true, starts: true, ends: true } as const;

async function findTrip(db: PrismaClient, userId: string, tripId: string | null) {
  const trip = tripId && await db.trip.findFirst({
    where: { id: tripId, members: { some: { userId } } },
    select: { ...tripDetails, invite: true, ownerId: true },
  });
  if (!trip) throw new RequestError("Trip room not found.", 404);
  return trip;
}

export async function listTrips(db: PrismaClient, userId: string): Promise<TripSummary[]> {
  const trips = await db.trip.findMany({
    where: { members: { some: { userId } } },
    select: { ...tripDetails, _count: { select: { members: true } } },
    orderBy: { created: "desc" },
  });
  if (!trips.length) return [];
  const totals = await db.expense.groupBy({
    by: ["tripId"],
    where: { tripId: { in: trips.map(({ id }) => id) } },
    _sum: { amount: true },
  });
  const amountByTrip = new Map(totals.map(({ tripId, _sum }) => [tripId, Number(_sum.amount ?? 0)]));
  return trips.map(({ _count, ...trip }) => ({ ...trip, memberCount: _count.members, total: amountByTrip.get(trip.id) ?? 0 }));
}

export async function readRoom(db: PrismaClient, userId: string, tripId: string | null): Promise<Room> {
  const trip = await findTrip(db, userId, tripId);
  const entries = await db.expense.findMany({
    where: { tripId: trip.id },
    select: { id: true, title: true, category: true, amount: true, spentOn: true, payerId: true, payer: { select: { name: true } } },
    orderBy: [{ spentOn: "desc" }, { created: "desc" }],
  });
  const membership = await db.member.findMany({
    where: { tripId: trip.id },
    select: { user: { select: { id: true, name: true, photo: true } } },
    orderBy: [{ user: { name: "asc" } }, { userId: "asc" }],
  });
  const expenses = entries.map(({ amount, payer, ...expense }) => ({ ...expense, amount: Number(amount), payer: payer.name }));
  return { trip, expenses, ...calculateSettlement(membership.map(({ user }) => user), expenses) };
}

export async function createTrip(db: PrismaClient, ownerId: string, body: RequestBody) {
  const name = stringField(body, "name", 100, true);
  const destination = stringField(body, "destination", 100, true);
  const starts = dateField(body, "starts");
  const ends = dateField(body, "ends");
  if (starts && ends && ends < starts) throw new RequestError("The end date must follow the start date.");
  const id = crypto.randomUUID();
  return db.trip.create({
    data: {
      id, name, destination, starts, ends, invite: randomToken(), created: BigInt(Date.now()),
      owner: { connect: { id: ownerId } },
      members: { create: { id: `${id}:${ownerId}`, user: { connect: { id: ownerId } } } },
    },
    select: { id: true },
  });
}

export async function joinTrip(db: PrismaClient, userId: string, body: RequestBody) {
  const invite = stringField(body, "invite", 48, true);
  const trip = await db.trip.findUnique({ where: { invite }, select: { id: true } });
  if (!trip) throw new RequestError("This invite link is invalid.", 404);
  const id = `${trip.id}:${userId}`;
  try {
    await db.member.upsert({
      where: { id },
      create: { id, tripId: trip.id, userId },
      update: {},
    });
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
  }
  return trip;
}

export async function addExpense(db: PrismaClient, userId: string, body: RequestBody) {
  const trip = await findTrip(db, userId, stringField(body, "trip", 36, true));
  const title = stringField(body, "title", 120, true);
  const category = categories.find((item) => item === body.category);
  if (!category) throw new RequestError("Choose an expense category.");
  const payerId = stringField(body, "payer", 36, true);
  const member = await db.member.findUnique({ where: { tripId_userId: { tripId: trip.id, userId: payerId } }, select: { userId: true } });
  if (!member) throw new RequestError("Choose a trip member as the payer.");
  const amountText = stringField(body, "amount", 12, true);
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(amountText)) throw new RequestError("Enter a valid amount.");
  const [rupees, paise = ""] = amountText.split(".");
  const amount = BigInt(rupees) * BigInt(100) + BigInt(paise.padEnd(2, "0"));
  if (!amount) throw new RequestError("Enter an amount greater than zero.");
  const spentOn = dateField(body, "spentOn", true);
  return db.expense.create({
    data: { id: crypto.randomUUID(), tripId: trip.id, payerId, title, category, amount, spentOn, created: BigInt(Date.now()) },
    select: { id: true },
  });
}

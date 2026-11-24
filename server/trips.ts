import { Prisma, type PrismaClient } from "@prisma/client";
import { calculateSettlement } from "../lib/settlements";
import { categories, maxStopLength, maxTripStops, type Room, type TripSummary } from "../lib/trip-types";
import { randomToken } from "./accounts";
import { amountField, dateField, isUniqueConflict, RequestError, stringField, type RequestBody } from "./request";

const tripDetails = { id: true, name: true, origin: true, destination: true, starts: true, ends: true, stops: true, endedAt: true } as const;
const activeTrip = {
  OR: [{ endedAt: null }, { endedAt: { isSet: false } }],
} satisfies Prisma.TripWhereInput;

function readStops(value: unknown) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > maxTripStops) {
    throw new RequestError(`Add up to ${maxTripStops} stops.`);
  }
  return value.map((stop: unknown) => {
    if (typeof stop !== "string" || !stop.trim() || stop.trim().length > maxStopLength) {
      throw new RequestError(`Enter a name of up to ${maxStopLength} characters for each stop.`);
    }
    return stop.trim();
  });
}

async function changeActiveTrip<T>(
  db: PrismaClient,
  id: string,
  change: (transaction: Prisma.TransactionClient) => Promise<T>,
) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(async (transaction) => {
        // Editing and ending the trip write the same document, so they cannot race past each other.
        const { count } = await transaction.trip.updateMany({
          where: { id, ...activeTrip },
          data: { version: crypto.randomUUID() },
        });
        if (!count) throw new RequestError("This trip has ended.", 409);
        return change(transaction);
      });
    } catch (error) {
      if (attempt >= 2 || !(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034") throw error;
    }
  }
}

async function findTrip(db: Prisma.TransactionClient, userId: string, tripId: string | null) {
  const trip = tripId && await db.trip.findFirst({
    where: { id: tripId, members: { some: { userId } } },
    select: { ...tripDetails, invite: true, ownerId: true, deposits: true },
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
  return trips.map(({ _count, endedAt, ...trip }) => ({
    ...trip, endedAt: endedAt?.toISOString() ?? null, memberCount: _count.members, total: amountByTrip.get(trip.id) ?? 0,
  }));
}

export async function readRoom(db: PrismaClient, userId: string, tripId: string | null): Promise<Room> {
  return db.$transaction(async (transaction) => {
    const { deposits, ...trip } = await findTrip(transaction, userId, tripId);
    const entries = await transaction.expense.findMany({
      where: { tripId: trip.id },
      select: {
        id: true, title: true, category: true, amount: true, spentOn: true, payerId: true,
        location: true, fromBudget: true, payer: { select: { name: true } },
      },
      orderBy: [{ spentOn: "desc" }, { created: "desc" }],
    });
    const membership = await transaction.member.findMany({
      where: { tripId: trip.id },
      select: { user: { select: { id: true, name: true, photo: true } } },
      orderBy: [{ user: { name: "asc" } }, { userId: "asc" }],
    });
    const expenses = entries.map(({ amount, payer, fromBudget, ...expense }) => ({
      ...expense, amount: Number(amount), payer: payer.name, fromBudget: fromBudget === true,
    }));
    const budgetDeposits = deposits.map(({ amount, ...deposit }) => ({ ...deposit, amount: Number(amount) }));
    return {
      trip: { ...trip, endedAt: trip.endedAt?.toISOString() ?? null },
      expenses,
      ...calculateSettlement(membership.map(({ user }) => user), expenses, budgetDeposits),
    };
  });
}

export async function createTrip(db: PrismaClient, ownerId: string, body: RequestBody) {
  const name = stringField(body, "name", 100, true);
  const origin = body.origin === undefined ? null : stringField(body, "origin", 100, true);
  const destination = stringField(body, "destination", 100, true);
  const starts = dateField(body, "starts");
  const ends = dateField(body, "ends");
  const stops = readStops(body.stops);
  const initialBudget = stringField(body, "initialBudget", 12);
  const deposits = initialBudget ? [{
    id: crypto.randomUUID(), memberId: ownerId, amount: amountField(body, "initialBudget"),
  }] : [];
  if (starts && ends && ends < starts) throw new RequestError("The end date must follow the start date.");
  const id = crypto.randomUUID();
  return db.trip.create({
    data: {
      id, name, origin, destination, starts, ends, stops, deposits, invite: randomToken(), created: BigInt(Date.now()),
      owner: { connect: { id: ownerId } },
      members: { create: { id: `${id}:${ownerId}`, user: { connect: { id: ownerId } } } },
    },
    select: { id: true },
  });
}

export async function addBudgetDeposit(db: PrismaClient, userId: string, body: RequestBody) {
  const trip = await findTrip(db, userId, stringField(body, "trip", 36, true));
  if (trip.ownerId !== userId) throw new RequestError("Only the trip organizer can add budget contributions.", 403);
  const memberId = stringField(body, "member", 36, true);
  const member = await db.member.findUnique({
    where: { tripId_userId: { tripId: trip.id, userId: memberId } },
    select: { userId: true },
  });
  if (!member) throw new RequestError("Choose a trip member for this contribution.");
  const deposit = { id: crypto.randomUUID(), memberId, amount: amountField(body) };
  await changeActiveTrip(db, trip.id, (transaction) => transaction.trip.update({
    where: { id: trip.id }, data: { deposits: { push: deposit } }, select: { id: true },
  }));
  return { id: deposit.id };
}

export async function endTrip(db: PrismaClient, userId: string, body: RequestBody) {
  const trip = await findTrip(db, userId, stringField(body, "trip", 36, true));
  if (trip.ownerId !== userId) throw new RequestError("Only the trip organizer can end it.", 403);
  if (trip.endedAt) return { endedAt: trip.endedAt.toISOString() };

  const endedAt = new Date();
  const { count } = await db.trip.updateMany({ where: { id: trip.id, ownerId: userId, ...activeTrip }, data: { endedAt } });
  if (count) return { endedAt: endedAt.toISOString() };
  const existing = await db.trip.findUnique({ where: { id: trip.id }, select: { endedAt: true } });
  if (!existing?.endedAt) throw new RequestError("Trip room not found.", 404);
  return { endedAt: existing.endedAt.toISOString() };
}

export async function joinTrip(db: PrismaClient, userId: string, body: RequestBody) {
  const invite = stringField(body, "invite", 48, true);
  const trip = await db.trip.findUnique({ where: { invite }, select: { id: true } });
  if (!trip) throw new RequestError("This invite link is invalid.", 404);
  const existing = await db.member.findUnique({
    where: { tripId_userId: { tripId: trip.id, userId } },
    select: { id: true },
  });
  if (existing) return trip;
  const id = `${trip.id}:${userId}`;
  try {
    await changeActiveTrip(db, trip.id, (transaction) => transaction.member.upsert({
      where: { id },
      create: { id, tripId: trip.id, userId },
      update: {},
    }));
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
  const amount = amountField(body);
  const location = stringField(body, "location", 120) || null;
  const funding = body.funding ?? "personal";
  if (funding !== "personal" && funding !== "budget") throw new RequestError("Choose a payment source.");
  const fromBudget = funding === "budget";
  const spentOn = dateField(body, "spentOn", true);
  return changeActiveTrip(db, trip.id, async (transaction) => {
    if (fromBudget) {
      const { deposits } = await transaction.trip.findUniqueOrThrow({ where: { id: trip.id }, select: { deposits: true } });
      const spent = await transaction.expense.aggregate({ where: { tripId: trip.id, fromBudget: true }, _sum: { amount: true } });
      const available = deposits.reduce((sum, deposit) => sum + deposit.amount, BigInt(0)) - (spent._sum.amount ?? BigInt(0));
      if (amount > available) throw new RequestError("The group budget doesn’t have enough money for this expense.", 409);
    }
    return transaction.expense.create({
      data: { id: crypto.randomUUID(), tripId: trip.id, payerId, title, category, location, fromBudget, amount, spentOn, created: BigInt(Date.now()) },
      select: { id: true },
    });
  });
}

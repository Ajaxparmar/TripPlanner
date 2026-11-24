import { Prisma, type PrismaClient } from "@prisma/client";
import { authenticate, findUser, sessionToken, signOut, updateProfile } from "./accounts";
import { json, readBody, RequestError } from "./request";
import { addExpense, createTrip, joinTrip, listTrips, readRoom } from "./trips";

export async function tripApi(request: Request, db: PrismaClient, action: string) {
  try {
    const token = await sessionToken(request);
    const { searchParams } = new URL(request.url);

    if (request.method === "POST" && (action === "register" || action === "login")) {
      const register = action === "register";
      const { user, cookie } = await authenticate(db, request, await readBody(request), register, token);
      return json({ user }, register ? 201 : 200, cookie);
    }

    const user = await findUser(db, token);
    if (request.method === "GET" && action === "session") return json({ user });
    if (!user || !token) throw new RequestError("Sign in to continue.", 401);

    if (request.method === "GET") {
      if (action === "trips") return json({ trips: await listTrips(db, user.id) });
      if (action === "room") return json(await readRoom(db, user.id, searchParams.get("trip")));
    }

    if (request.method === "POST") {
      const body = await readBody(request);
      switch (action) {
        case "logout": return json({}, 200, await signOut(db, request, token));
        case "profile": return json({ user: await updateProfile(db, user.id, body) });
        case "trips": return json(await createTrip(db, user.id, body), 201);
        case "join": return json(await joinTrip(db, user.id, body));
        case "expenses": return json(await addExpense(db, user.id, body), 201);
      }
    }

    throw new RequestError("Page not found.", 404);
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status);
    if (error instanceof Prisma.PrismaClientInitializationError ||
      (error instanceof Prisma.PrismaClientKnownRequestError && ["P1001", "P1002", "P1017"].includes(error.code))) {
      console.error("Tripthread could not connect to MongoDB.");
      return json({ error: "Tripthread can’t connect to its database right now." }, 503);
    }
    console.error("Tripthread API error", error);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}

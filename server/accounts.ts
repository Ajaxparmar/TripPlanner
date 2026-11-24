import type { PrismaClient } from "@prisma/client";
import { isUniqueConflict, RequestError, stringField, type RequestBody } from "./request";

const sessionSeconds = 30 * 24 * 60 * 60;
const cookieName = "tripthread_session";
const encoder = new TextEncoder();
const hex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
export const randomToken = () => hex(crypto.getRandomValues(new Uint8Array(24)));
const publicProfile = { id: true, email: true, name: true, city: true, bio: true, photo: true } as const;

async function digest(value: string) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

async function passwordHash(password: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = await crypto.subtle.deriveBits({
    name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 600_000,
  }, key, 256);
  return hex(new Uint8Array(hash));
}

function equalHash(a: string, b: string) {
  let difference = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

function profile(body: RequestBody) {
  const photo = stringField(body, "photo", 400_000);
  if (photo && !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo)) {
    throw new RequestError("Choose a JPEG, PNG, or WebP profile photo.");
  }
  return { name: stringField(body, "name", 80, true), city: stringField(body, "city", 80), bio: stringField(body, "bio", 240), photo };
}

export async function sessionToken(request: Request) {
  const raw = request.headers.get("cookie")?.match(/(?:^|;\s*)tripthread_session=([a-f0-9]{48})(?:;|$)/)?.[1];
  return raw ? digest(raw) : null;
}

function sessionCookie(request: Request, value: string, age: number) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure}`;
}

export async function findUser(db: PrismaClient, token: string | null) {
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token, expires: { gt: BigInt(Date.now()) } },
    select: { user: { select: publicProfile } },
  });
  return session?.user ?? null;
}

export async function authenticate(db: PrismaClient, request: Request, body: RequestBody, register: boolean, previous: string | null) {
  const email = stringField(body, "email", 254, true).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length > 128 || !password) {
    throw new RequestError("Enter a valid email and password.");
  }

  const rawToken = randomToken();
  const token = await digest(rawToken);
  const expires = BigInt(Date.now() + sessionSeconds * 1000);
  const session = { token, expires };
  let user;
  if (register) {
    if (password.length < 8) throw new RequestError("Use at least 8 characters for your password.");
    const details = profile(body);
    const salt = randomToken();
    const storedPassword = `${salt}:${await passwordHash(password, salt)}`;
    try {
      user = await db.user.create({
        data: {
          ...details, email, id: crypto.randomUUID(), password: storedPassword,
          sessions: { create: session },
        },
        select: publicProfile,
      });
    } catch (error) {
      if (isUniqueConflict(error)) throw new RequestError("An account already uses that email.", 409);
      throw error;
    }
  } else {
    const account = await db.user.findUnique({ where: { email }, select: { ...publicProfile, password: true } });
    const [salt, expected] = account?.password.split(":") ?? ["invalid-account", ""];
    if (!equalHash(await passwordHash(password, salt), expected) || !account) {
      throw new RequestError("Email or password is incorrect.", 401);
    }
    const { password: _, ...safeUser } = account;
    user = safeUser;
    await db.session.create({ data: { ...session, userId: user.id } });
  }
  await db.session.deleteMany({
    where: { OR: [{ expires: { lte: BigInt(Date.now()) } }, ...(previous ? [{ token: previous }] : [])] },
  });
  return { user, cookie: sessionCookie(request, rawToken, sessionSeconds) };
}

export async function signOut(db: PrismaClient, request: Request, token: string) {
  await db.session.deleteMany({ where: { token } });
  return sessionCookie(request, "", 0);
}

export function updateProfile(db: PrismaClient, userId: string, body: RequestBody) {
  return db.user.update({ where: { id: userId }, data: profile(body), select: publicProfile });
}

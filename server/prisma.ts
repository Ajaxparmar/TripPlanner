import { PrismaClient } from "@prisma/client";

const runtime = globalThis as typeof globalThis & { tripthreadMongoPrisma?: PrismaClient };

export function database() {
  runtime.tripthreadMongoPrisma ??= new PrismaClient();
  return runtime.tripthreadMongoPrisma;
}

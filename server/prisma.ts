import { PrismaClient } from "@prisma/client";

type Connection = { url: string | undefined; client: PrismaClient };
const runtime = globalThis as typeof globalThis & { tripthreadMongoConnection?: Connection };

export function database() {
  const url = process.env.DATABASE_URL;
  const previous = runtime.tripthreadMongoConnection;
  if (previous && previous.url === url) return previous.client;

  const client = new PrismaClient({ datasourceUrl: url });
  runtime.tripthreadMongoConnection = { url, client };
  if (previous) {
    void previous.client.$disconnect().catch(() => {
      console.error("Tripthread could not close the previous MongoDB connection.");
    });
  }
  return client;
}

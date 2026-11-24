import { tripApi } from "@/server/api";
import { database } from "@/server/prisma";

async function handle(request: Request, context: RouteContext<"/api/[action]">) {
  const { action } = await context.params;
  return tripApi(request, database(), action);
}

export { handle as GET, handle as POST };

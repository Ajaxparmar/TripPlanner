# Tripthread

Tripthread lets friends open a trip room, invite others, record expenses, and work out who pays whom.

## Run locally

Use Node.js 22 and set `DATABASE_URL` in `.env` to the connection string for a MongoDB replica set, such as an Atlas cluster. The connection string must include a database name.

```sh
npm ci
npm run db:push
npm run dev
```

Open http://localhost:3000. Run `npm run db:push` when setting up a database or changing its indexes. For production, set `DATABASE_URL` on your Node.js host and run `npm run build` followed by `npm start`.

## Project layout

- `app/` holds the login, registration, profile, trip list, trip room, and invite pages.
- `components/tripthread/` holds the shared forms, ledger, and settlement display.
- `server/` holds the API and Prisma queries. The MongoDB schema lives in `prisma/schema.prisma`.
- `lib/settlements.ts` totals expenses and calculates transfers in integer paise.

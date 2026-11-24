# Tripthread

Tripthread helps friends share trip expenses. Create a trip room, invite friends, record who paid, and see the transfers needed to give everyone an equal share.

## What you can do

- Create an account and personalize your profile with a photo, home city, and bio.
- Create a trip room and share its invite link directly or through WhatsApp.
- Record an expense in INR with a payer, category, and date.
- See each tripmate's payments, share, and balance in the room. **Who pays whom** shows the suggested transfers.

The app splits the full trip total among current tripmates and recalculates when someone joins. It uses integer paise and distributes any remainder one paisa at a time so the shares add up exactly.

If Akhil pays ₹2,000 and Meera pays ₹1,000 on a three-person trip, everyone's share is ₹1,000. Dev, who paid ₹0 upfront, pays Akhil ₹1,000.

## Run locally

Use Node.js 22 and a MongoDB replica set, such as MongoDB Atlas. Open a terminal in the `trip-planner` folder and install the dependencies.

```sh
npm install
```

Create a `.env` file in the same folder with your MongoDB connection string. Include the name of the database you want Tripthread to use.

```dotenv
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster-host>/tripthread"
```

```sh
npm run db:push
npm run dev
```

Open `http://localhost:3000` and select **Create account**. Run `npm run db:push` when setting up a database or changing the Prisma schema and its indexes.

If signup reports a database connection error, check that the cluster is active, the credentials are correct, and the cluster allows connections from your network.

## Common commands

| Command | What it does |
| --- | --- |
| `npm install` | Installs project dependencies |
| `npm run db:push` | Applies the Prisma schema and indexes to MongoDB |
| `npm run db:generate` | Regenerates Prisma Client |
| `npm run dev` | Starts the local development server |
| `npm run lint` | Runs ESLint |
| `npm run build` | Creates the production build |
| `npm start` | Serves the production build |

## Production

Set `DATABASE_URL` on your Node.js host, apply the Prisma schema to the target database, and run the production build.

```sh
npm run db:push
npm run build
npm start
```

Share invites from the deployed address so friends can open them from their own devices.

## Project layout

| Path | Contents |
| --- | --- |
| [`app/`](app/) | Next.js App Router pages and API route handlers |
| [`components/tripthread/`](components/tripthread/) | Account forms, trip room UI, expense ledger, and settlement display |
| [`server/`](server/) | Session handling, expense operations, and Prisma queries |
| [`prisma/schema.prisma`](prisma/schema.prisma) | MongoDB models and indexes |
| [`lib/settlements.ts`](lib/settlements.ts) | Equal-share and payment calculations |

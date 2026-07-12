# Messenger

Phone-verified messaging with a compliance-oriented admin panel. Built for
Next.js 14 (App Router) + Neon (Postgres, free tier) + Upstash (Redis, free
tier), deployable to Vercel's free tier.

## What's actually implemented vs. stubbed

**Implemented and working:**
- Phone number + OTP sign-in (OTP codes live in Upstash Redis with a 5-minute TTL, rate-limited)
- Phone numbers are never stored in plaintext — only an HMAC hash + last 4 digits for display
- Username-based identity (what other users see/search for)
- 1:1 conversations, text messages, view-once photos that are server-side deleted after one view
- Admin panel: data access **requests** → approve/deny → export, with every action written to an immutable audit log
- Session auth via signed JWT in an httpOnly cookie, route protection via middleware

**Stubbed — you need to wire these up:**
- **SMS sending**: `src/app/api/auth/request-otp/route.ts` has a `sendSms()` placeholder. In dev, codes are just printed to the server console so you can test the whole flow without an SMS bill. Plug in Twilio / Vonage / MSG91 / etc. before going live.
- **Photo upload/storage**: the `mediaUrl` field expects a URL to already-uploaded media (e.g. a signed URL from Cloudflare R2, Backblaze B2, or Vercel Blob — all have free tiers). This scaffold doesn't include an upload endpoint.
- **End-to-end encryption**: `Message.content` is currently plaintext at rest. For real "top-tier" privacy, encrypt on the client (e.g. via `libsodium-wrappers`) before sending, and store only ciphertext. The admin export intentionally does **not** decrypt content — it exports metadata only — so E2E and the compliance flow are designed to coexist.
- **Realtime delivery**: messages currently require a page reload / poll to see new ones. Wiring up realtime (Upstash's Redis pub/sub, or a separate WebSocket service) is a follow-up.
- **First admin account**: there's no signup flow for admins by design. Promote a user manually (see below).

## Local setup

1. **Neon**: create a free project at neon.tech. Copy the *pooled* connection string into `DATABASE_URL` and the *direct* connection string into `DIRECT_URL`.
2. **Upstash**: create a free Redis database at upstash.com. Copy the REST URL + token into `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
3. Generate secrets:
   ```bash
   openssl rand -hex 32   # → JWT_SECRET
   openssl rand -hex 32   # → PHONE_HASH_SECRET (use a DIFFERENT value than JWT_SECRET)
   ```
4. Copy `.env.example` to `.env` and fill in the values above.
5. Install and push the schema:
   ```bash
   npm install
   npm run db:push
   ```
6. Run it:
   ```bash
   npm run dev
   ```
7. Visit `/login`, enter a phone number in E.164 format (e.g. `+14155551234`), and check your terminal for the printed OTP code (dev mode only).
8. Hit `/api/health` to confirm both Neon and Upstash are reachable.

## Promoting a user to admin

There's deliberately no self-serve way to become an admin. After creating a
normal account through `/login`, promote it directly in Neon's SQL console
(or `npx prisma studio`):

```sql
UPDATE "User" SET role = 'ADMIN' WHERE username = 'your_username';
```

## Free-tier gotchas this project already accounts for

- **Neon connection limits**: the Prisma client is a singleton (`src/lib/db.ts`) reused across hot reloads/invocations, and uses Neon's *pooled* connection string, so you don't exhaust the free tier's connection cap under load.
- **Upstash command budget**: OTPs use Redis `SET ... EX` (auto-expiring, no cleanup job needed) instead of a cron/sweep job, and the REST client means no lingering TCP connections eating into serverless execution time.
- **Cold starts**: Prisma + Neon's pooled connection is compatible with Vercel's free-tier serverless functions (no persistent connection required).
- **SMS cost**: dev mode never calls a real SMS provider — codes print to the console — so you can fully test the auth flow before spending anything on SMS.

## Deploying (Vercel free tier)

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add all the `.env` values as Vercel environment variables (Project Settings → Environment Variables).
4. Deploy. Vercel will run `npm run build`, which runs `prisma generate` first.
5. Run `npm run db:push` once against your production `DATABASE_URL`/`DIRECT_URL` (from your local machine, pointed at prod env vars) to create the tables — or wire up `prisma migrate deploy` in a release step.

## Security notes

- The admin panel does **not** give standing read-access to message content. Every export requires a `DataAccessRequest` row, an approval step, and writes an `AuditLog` entry — there's no code path that skips this.
- Phone numbers are hashed (HMAC-SHA256, keyed by `PHONE_HASH_SECRET`) before storage. Rotating `PHONE_HASH_SECRET` will invalidate lookups for existing users, so treat it like any other long-lived secret.
- Rotate `JWT_SECRET` to invalidate all sessions at once if needed.

# IPChat

IPChat is a **source-only Next.js web messenger prototype**. This repository does
not currently provide a packaged desktop/mobile app, a GitHub release, or a
verified public download. It needs your own Postgres and Redis services to run.
The code is intended for development and review; do not expose it to untrusted
users until authentication, media access, and deployment have been independently
security tested.

## What the source currently does

- Provides phone/OTP sign-in, usernames, one-to-one text conversations, status
  pages, settings, and an admin workspace.
- Stores a keyed hash and last four digits of a phone in Postgres. In manual
  delivery mode, Redis temporarily holds the full phone number and OTP for up
  to five minutes so an existing administrator can relay the code.
- Encrypts text message content **on the server** with AES-256-GCM before
  database storage. Participants receive decrypted text from the API. This is
  **not end-to-end encryption**.
- Allows approved admin data-access requests to export user and message
  metadata; the export route does not include message content. Actions are
  recorded in database audit rows, which are not a tamper-proof external log.
- Records view-once photo consumption by clearing the message's stored media
  URL after a recipient view. It does **not** delete an externally hosted image.

## Requirements

- Node.js **22.16.0** (see `.node-version` and `package.json`) and npm.
- A disposable Postgres database for local development. The Prisma schema uses
  `DATABASE_URL` for the pooled runtime connection and `DIRECT_URL` for schema
  operations.
- An Upstash Redis REST URL and token for OTPs and rate limits.

There is no bundled database, Redis server, SMS provider, or photo-upload
service. This is a web app, not an APK or native application.

## Local source setup

1. Clone this repository, use Node.js 22.16.0, and install the locked
   dependencies:

   ```bash
   git clone https://github.com/yash-l/ipchat.git
   cd ipchat
   npm ci
   ```

2. Copy `.env.example` to `.env`. Replace every placeholder with values for
   your **disposable** Postgres and Redis resources. Generate three separate
   random values for `JWT_SECRET`, `PHONE_HASH_SECRET`, and
   `MESSAGE_ENCRYPTION_KEY`:

   ```bash
   openssl rand -hex 32
   ```

   Use the resulting 64-character hex value for each variable, generating it
   anew each time. Keep `.env` out of Git and never paste a real OTP or secret
   into an issue.

3. Apply the Prisma schema **only to that disposable database**, then start
   the development server:

   ```bash
   npm run db:push
   npm run dev
   ```

4. Open `http://localhost:3000/login`. The service check is
   `http://localhost:3000/api/health`; it returns HTTP 200 only when both
   Postgres and Redis respond.

### First-login limitation

The checked-in `.env.example` sets `OTP_DELIVERY_MODE=ADMIN_PORTAL`. This
queues codes for an **already signed-in administrator** to deliver manually.
On a fresh database there is no administrator yet, so the first login cannot
be completed through the documented UI alone. Removing the mode in development
returns a `development` response, but the current route logs only a phone
hash, not the OTP code. SMS sending is not integrated. A reviewed, local-only
bootstrap path or an authorized pre-provisioning procedure is needed before a
fresh installation can complete its first sign-in. Do not use real phone
numbers as a workaround.

After a user can verify a code, `src/app/api/auth/verify-otp/route.ts` assigns
the `ADMIN` role when the verified number matches `OWNER_PHONE_E164`. This is
not a substitute for the missing first-code delivery step.

## Limits before a public launch

- No implemented SMS provider or media upload/storage endpoint. Photo messages
  accept an existing media URL; view-once handling is not file deletion.
- No end-to-end encryption or pushed real-time delivery.
- Authentication, media access, and public health responses need a separate
  security review. A successful local build or service health response does not
  establish production readiness.
- `render.yaml` describes a Render web service and currently runs
  `prisma db push` in its build command. Review and replace that schema-change
  step with an approved migration/release process before attaching any
  important database. This README does not endorse a production deploy.
- There are currently no GitHub release binaries or verified download counts.

## Source map

| Area | Location |
| --- | --- |
| Sign-in and OTP delivery | `src/app/api/auth/`, `src/lib/otp.ts`, `src/lib/admin-otp.ts` |
| Conversations and message encryption | `src/app/api/conversations/`, `src/lib/message-crypto.ts` |
| Admin access requests and export | `src/app/api/admin/` |
| Database models | `prisma/schema.prisma` |
| Deployment blueprint | `render.yaml` |

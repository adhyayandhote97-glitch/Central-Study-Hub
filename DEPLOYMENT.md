# Deployment Guide

This guide takes Central Study Hub from local development to a live, HTTPS,
custom-domain production deployment using the recommended stack:

- **Vercel** (Hobby / Free plan) — hosts the Next.js app (SSR + API routes)
- **Firebase Spark** (free plan) — Authentication, Firestore, Storage
- **Google Drive** (Google Workspace or personal) — supplementary storage for
  large resource files, linked in as external resources

> **Read this first — the app is server-rendered.** Central Study Hub uses
> Next.js App Router with API routes, middleware, and server components. It is
> **not** a static site, so it needs a host that runs Node.js for you. Vercel
> is that host — Firebase itself is only used for Auth/Firestore/Storage, never
> for hosting the app, which is exactly what keeps this whole stack on the free
> **Spark** plan (see §0).

---

## 0. Is this stack really free? (Spark compatibility)

**Yes — this architecture is fully compatible with Firebase Spark.** The two
things that would force an upgrade to Blaze are (a) hosting the app itself on
Firebase App Hosting or Cloud Run, and (b) making outbound network calls from
a Cloud Function. This project does neither:

- The app is hosted on **Vercel**, a separate product entirely — Firebase's
  Spark/Blaze distinction doesn't apply to it at all.
- Firebase is used only for **Auth, Firestore, and Storage** — all three are
  available on Spark, with generous daily free quotas (see the table below).
- There are **no Cloud Functions** anywhere in this project (confirmed: no
  `functions/` directory, no `firebase-functions` dependency). All server
  logic runs as Next.js API routes on Vercel, not as Firebase Cloud Functions,
  so Spark's "no outbound calls" restriction (which only applies to Cloud
  Functions/Cloud Run) never comes into play.
- **Google Drive** is a separate Google product with its own free storage
  (15 GB on a personal account; more on Google Workspace) — it has no
  relationship to your Firebase plan or billing at all.

**Spark's free daily quotas** (current as of writing — confirm on the
[Firebase pricing page](https://firebase.google.com/pricing) for your region):

| Service | Free quota | Notes |
|---|---|---|
| Firestore | 50K reads/day, 20K writes/day, 20K deletes/day, 1 GiB stored | Resets daily |
| Storage | 5 GB stored, 1 GB/day served, 20K uploads/day | Resets daily |
| Authentication | Unlimited | Custom-token sign-in (what this app uses) has no per-verification cost on any plan |

For a single school cohort, day-to-day usage sits comfortably inside these
limits — see `PROJECT_DEPLOYMENT_COSTS.md` for cohort-size estimates. If a
quota is ever exceeded, Firestore/Storage calls fail until the quota resets
(daily) or you upgrade to Blaze — there's no automatic overage charge on Spark.

---

## 1. Local development vs. production

| Environment | Firebase | Why |
|---|---|---|
| **Local development** | **Firebase Local Emulator Suite** | No cloud cost, no risk to real data, instant reset, works offline. This is what `npm run emulators` runs today (project `demo-central-study-hub`). |
| **Production** | **A real Firebase project on the Spark plan** | Real Auth/Firestore/Storage, no billing account needed. |

Keep using the emulator for day-to-day development. Create the real project
only for the deployed app, and never point local dev at production data. The
two are selected purely by environment variables — the same code runs against
both.

---

## 2. Create the production Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/) → **Add
   project**. Give it a real name (e.g. `central-study-hub`). Leave it on the
   default **Spark** plan — no billing account is required.
2. Enable the three services:
   - **Authentication** → Get started. No sign-in provider toggle is needed —
     custom-token sign-in (what this app uses) works as soon as Auth is enabled.
   - **Firestore Database** → Create database → production mode → pick a region
     close to your users (e.g. `asia-south1` for India).
   - **Storage** → Get started → production mode → same region.

---

## 3. Set up Google Drive for large files (optional, supplementary)

Firebase Storage's free tier (5 GB stored, 1 GB/day served) comfortably covers
notes, past papers, and images. For a handful of large files — long video
recordings, big archive bundles — you can instead host them in Google Drive
and link them into the app as external resources, at no Firebase cost:

1. Create a folder in Google Drive (a Workspace shared drive if your school has
   one, or a regular My Drive folder) to hold study resources.
2. Upload the file, then **Share → General access → Anyone with the link →
   Viewer**. (Students authenticate with the app's shared access key, not a
   Google account, so the link must be viewable without a Google sign-in
   prompt — "Anyone with the link" is required, not "Restricted".)
3. Copy the share link.
4. In the Admin Console → **Upload Resource**, choose the **Link** option
   (instead of File Upload) and paste the Drive link as the resource URL. The
   app already recognises `drive.google.com` / `docs.google.com` links
   (`src/lib/resource-type.ts`) and shows the correct Drive/Docs/Slides/Sheets
   icon automatically — no extra configuration needed.

This is entirely optional and requires no API keys or code changes — it's the
same "external link" resource type the app already supports for YouTube and
other external URLs.

---

## 4. Environment variables

Copy `.env.example` to `.env.local` and fill in **real** values (see the file
for the full annotated list). The groups:

- **Access keys** — `STUDENT_ACCESS_KEY`, `ADMIN_ACCESS_KEY`. **Rotate these
  from the defaults before launch.**
- **`SESSION_SECRET`** — generate with `openssl rand -base64 48`.
- **Firebase Admin SDK** (server-only) — from Project settings → Service
  accounts → **Generate new private key**. Copy `project_id`, `client_email`,
  and `private_key` from the downloaded JSON into `FIREBASE_PROJECT_ID`,
  `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (keep the quotes and `\n`),
  and set `FIREBASE_STORAGE_BUCKET`.
- **Firebase Web SDK** (`NEXT_PUBLIC_*`, safe to expose) — from Project settings
  → General → Your apps → Web app → SDK config.

> On Vercel these are set as **Environment Variables** in the project
> dashboard, not a committed `.env.local`. See §6.

---

## 5. Deploy the security rules

The rules in `firestore.rules` and `storage.rules` only protect production once
deployed. With the Firebase CLI (`npm i -g firebase-tools`, then
`firebase login`):

```bash
# Point the CLI at your real project (replace the id)
firebase use --add            # choose your production project, alias it "prod"

# Deploy rules + indexes
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Re-run this whenever `firestore.rules`, `storage.rules`, or
`firestore.indexes.json` change.

---

## 6. Deploy the app to Vercel

1. **Push the repository to GitHub** (if it isn't already there).
2. Go to [vercel.com](https://vercel.com) → **Add New… → Project** → **Import**
   your GitHub repository. Sign up/log in with GitHub if needed — the **Hobby**
   plan is free and is what this guide uses.
3. Vercel **auto-detects Next.js** — no build configuration is needed (it runs
   `npm install && npm run build` and serves the result). Leave the default
   framework preset, build command, and output directory as-is.
4. **Add environment variables** — in the import screen (or later under
   **Project → Settings → Environment Variables**), add every variable from
   §4: `STUDENT_ACCESS_KEY`, `ADMIN_ACCESS_KEY`, `SESSION_SECRET`,
   `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`,
   `FIREBASE_STORAGE_BUCKET`, and the six `NEXT_PUBLIC_FIREBASE_*` values.
   Apply them to the **Production** environment (and Preview/Development too,
   if you want preview deployments to work against the same project).
   - `FIREBASE_PRIVATE_KEY` spans multiple lines with literal `\n` sequences —
     paste it exactly as it appears in `.env.local`, including the quotes.
5. Click **Deploy**. Vercel builds the app and gives you a live
   `https://<project>.vercel.app` URL over HTTPS within a minute or two.

That's the entire deployment — no Dockerfile, no server to manage, no App
Hosting-specific configuration.

---

## 7. Connect your custom domain (purchased elsewhere) to Vercel

1. In the Vercel dashboard, open your project → **Settings → Domains**.
2. Enter your domain (e.g. `studyhub.yourschool.edu`) and click **Add**.
3. Vercel shows the DNS records to create at your domain registrar (wherever
   you bought the domain — GoDaddy, Namecheap, Google Domains, etc.):
   - For a root domain (`yourschool.edu`), it will ask for an **A record**
     pointing to Vercel's IP.
   - For a subdomain (`studyhub.yourschool.edu`), it will ask for a **CNAME
     record** pointing to `cname.vercel-dns.com`.
4. Log into your registrar's DNS management panel and add the record(s) exactly
   as shown.
5. Back in Vercel, wait for the domain status to flip to **Valid** (DNS
   propagation is usually minutes, occasionally a few hours). Vercel then
   **automatically provisions a free TLS certificate** and serves the app over
   HTTPS with an automatic HTTP→HTTPS redirect — no extra steps.

You do not need to move your domain's registration to Vercel — only the DNS
records for this one (sub)domain need to point at Vercel.

---

## 8. Continuing development after deployment

**Yes — deployment is not a one-time event, and none of your data is at risk
from future code pushes.**

- **You can push updates whenever you want.** Vercel is a normal Git-based
  deployment: every `git push` to the connected branch triggers a new build.
- **Vercel redeploys automatically.** No manual "deploy" step is needed once
  the project is connected — a push to `main` (or whichever branch you set as
  the Production branch) rebuilds and replaces the live deployment
  automatically, typically within a minute or two. Pushes to other branches or
  pull requests get their own **Preview deployment** URLs, so you can test a
  change before it goes live.
- **Your Firebase data is completely unaffected by app deployments.**
  Firestore documents, Storage files, and Auth users live in your Firebase
  project — a separate service from Vercel entirely. Redeploying the app code
  never reads, writes, or touches this data. The only way Firestore data
  changes is through the app's normal read/write logic (or you editing it
  directly in the Firebase Console) — never through a deploy.
- **Your Google Drive resources are completely unaffected too.** They're
  files sitting in Drive, referenced by the app only as external link URLs
  stored in Firestore. Redeploying the app doesn't touch Drive at all, and
  Drive files/permissions are entirely under your manual control.

In short: code and data are fully decoupled. Deploy as often as you like.

---

## 9. Seed the production data

The 16 official subjects need to exist in the real database. Point the seed
script at production by setting the real Admin SDK env vars (from §4) in your
shell, then:

```bash
npm run seed            # creates the 16 subjects if missing
```

Facts, study tips, resources, and announcements are then managed live from the
Admin Console.

---

## 10. Production build check (before every release)

```bash
npm run lint            # zero warnings/errors
npx tsc --noEmit        # zero type errors
npm run build           # must succeed
```

Vercel runs the build for you on every push, but running it locally first
catches problems before they hit the deploy.

---

## 11. Post-deployment checklist

- [ ] Rules deployed (`firebase deploy --only firestore:rules,storage`)
- [ ] Access keys rotated from the defaults
- [ ] `SESSION_SECRET` is a fresh 48-byte random value
- [ ] All environment variables set in Vercel (Production environment)
- [ ] Custom domain resolves over HTTPS with a valid certificate
- [ ] Student and admin login both work on the live URL
- [ ] 16 subjects present; a test upload, announcement, and ticket round-trip works
- [ ] (If using Drive) a test Drive-linked resource opens correctly for a student
- [ ] Firebase project confirmed on the **Spark** plan (Project settings →
      Usage and billing) — no billing account attached

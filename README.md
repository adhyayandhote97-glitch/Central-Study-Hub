# Central Study Hub

A premium academic portal that centralises every learning resource for MYP5 students at
Victorious Kidss Educares — replacing scattered Drive folders, chat messages and lost links with
one calm, fast, beautiful place.

Built to feel like a modern SaaS product (Notion / Linear / Vercel), not a school website.

---

## Features

**For students**
- Browse all 10 MYP5 subjects, organised by topic and resource category
- Instant search across titles, descriptions, teachers, uploaders, topics and tags
- Inline preview for PDFs, images, videos, Google Docs/Slides/Sheets and YouTube — with a graceful
  download fallback for everything else
- Favourites, Recently Viewed and download history (per device)
- **Student Voice** — submit resource requests, bug reports, feedback and more; track each ticket,
  read admin replies, and reopen resolved tickets
- Announcements, pinned to the homepage
- Light / dark / system themes

**For admins**
- Dashboard with live stats (resources, subjects, uploads, tickets, storage, downloads) and a
  recent-activity feed
- Upload resources as files (to Firebase Storage) or as links (Drive/Docs/Slides/Sheets/YouTube/web),
  with full metadata; type + icon auto-detected
- Full resource manager: search, filter, sort, edit, feature, pin, archive, delete
- Manage each subject's topics
- Announcements with pinning and expiry
- Student Voice inbox: search/filter, reply, change status, private internal notes, delete
- Analytics charts (resources over time, by subject, by type; tickets by status)

---

## Tech stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (Radix) · **Framer Motion** · **lucide-react**
- **Firebase** — Authentication (custom tokens), Firestore, Storage, Admin SDK
- **React Hook Form** + **Zod** · **Recharts** · **Fuse.js** · **jose** (session JWT) · **next-themes**

---

## Architecture

- **Auth** — two shared access keys (student / admin) checked server-side. On login the server mints
  a signed, HttpOnly session cookie (JWT via `jose`) and a Firebase custom token; the browser signs
  in with the custom token so per-device data (favourites, history, tickets) is scoped to a stable
  Firebase `uid`.
- **Route protection** — `src/middleware.ts` (Edge runtime) verifies the session cookie and guards
  `/dashboard/**`, `/admin/**` and `/api/**`. `app/admin/layout.tsx` re-checks the role server-side.
  Every mutating API route also re-verifies the role (defense in depth).
- **Data access** — all Firestore writes and Storage uploads go through Next.js Route Handlers using
  the Firebase Admin SDK. The client SDK is used only for **reads** (real-time favourites / history /
  tickets) and Firebase Auth. Storage uploads are proxied through the Admin SDK (`file.save`), so the
  browser never touches the Storage SDK and Storage rules stay deny-all.
- **Security rules** — `firestore.rules` / `storage.rules` enforce the model even against direct SDK
  access: subjects/resources/announcements are read-only to signed-in users; tickets are readable only
  by their owner or an admin; favourites/recentViews/downloads are scoped to the caller's `uid`;
  internal ticket notes and analytics are admin-only. All privileged writes happen via the Admin SDK,
  which bypasses rules.

### Folder structure

```
src/
├── app/
│   ├── page.tsx                  # Landing + access-key form
│   ├── dashboard/                # Student area (home, subjects, resources, search,
│   │                             #   favourites, recently-viewed, announcements,
│   │                             #   student-voice, about, settings)
│   ├── admin/                    # Admin console (dashboard, upload, resources, subjects,
│   │                             #   tickets, announcements, analytics, settings)
│   └── api/                      # Route Handlers (auth, resources, subjects, tickets,
│                                 #   announcements, upload, admin stats/activity/analytics)
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── layout/ landing/ dashboard/ subjects/ resources/ student-voice/ admin/ settings/ theme/
├── context/auth-context.tsx      # Client auth state (Firebase + session)
├── hooks/                        # Data + UI hooks
├── lib/
│   ├── firebase/{client,admin}.ts
│   ├── auth/{session,requireRole}.ts
│   ├── db/                       # Admin-SDK data access (resources, subjects, tickets, …)
│   ├── validation/               # Zod schemas
│   └── resource-type.ts, embed-urls.ts, storage-upload.ts, …
├── types/                        # Shared TypeScript types
└── middleware.ts
```

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Environment variables

Copy the example file and fill it in:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `STUDENT_ACCESS_KEY` / `ADMIN_ACCESS_KEY` | Shared login keys |
| `SESSION_SECRET` | Random 32+ char string for signing the session cookie (`openssl rand -base64 48`) |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` / `FIREBASE_STORAGE_BUCKET` | Admin SDK (server) — from Project Settings → Service Accounts → *Generate new private key* |
| `NEXT_PUBLIC_FIREBASE_*` | Web SDK config — from Project Settings → General → Your apps |

### 3a. Local development with the Firebase Emulator (no real project needed)

The app runs fully — including uploads — against the Firebase Local Emulator Suite. Requires Java 11+.

```bash
# terminal 1 — start emulators (Auth, Firestore, Storage, UI on :4000)
npm run emulators

# terminal 2 — seed the 10 subjects, then run the app
npm run seed
npm run dev
```

`.env.local` ships pre-configured for the emulator (`NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` and the
`*_EMULATOR_HOST` variables). The included private key is a throwaway used only so the Admin SDK can
sign uploads against the emulator — it is not a real credential.

### 3b. Using a real Firebase project

1. Create a Firebase project.
2. Enable **Authentication** (custom-token sign-in works out of the box once Auth is on),
   **Firestore**, and **Storage**.
3. Project Settings → Service Accounts → *Generate new private key*; put the values into
   `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`.
4. Project Settings → General → Your apps → copy the web config into the `NEXT_PUBLIC_FIREBASE_*`
   variables.
5. Remove the `*_EMULATOR_HOST` lines and set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false` (or delete it).
6. Deploy security rules and indexes:
   ```bash
   npx firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
7. Seed the subjects once: `npm run seed`.

### 4. Log in

- **Student key** → `/dashboard`
- **Admin key** → `/admin`

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (type-checks + lints) |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run emulators` | Start the Firebase Local Emulator Suite |
| `npm run seed` | Seed the 10 MYP5 subjects into Firestore |

---

## Deployment

Deploy to any Node host (Vercel, Render, a container, …). Set every variable from `.env.example` in
the host's environment, and point Firebase at your real project (section 3b). Note that direct file
uploads are proxied through a Route Handler, so on serverless platforms with small request-body
limits, prefer linking large videos via YouTube/Drive rather than uploading them.

---

## Future improvements

- Bulk upload and drag-to-reorder in the resource manager
- Per-teacher pages and resource collections / playlists
- Email or push notifications when a ticket is answered
- Full-text search backend if the resource set grows by an order of magnitude
- Role-scoped admin accounts and an audit trail beyond the activity feed

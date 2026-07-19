# Project Deployment Costs

A realistic monthly cost estimate for running Central Study Hub for a school
cohort on the recommended stack: **Vercel (Hobby) + Firebase (Spark) + Google
Drive**.

> **Figures are approximate and region-dependent.** They reflect Vercel and
> Google Firebase pricing at the time of writing and are meant for planning,
> not billing. Always confirm against the live
> [Vercel pricing page](https://vercel.com/pricing) and
> [Firebase pricing page](https://firebase.google.com/pricing). "User" below
> means an active student device/browser (the app uses shared access keys, not
> individual accounts).

---

## 1. Why this stack is free — Spark, not Blaze

| | **Firebase Spark (free)** | **Firebase Blaze (pay-as-you-go)** |
|---|---|---|
| Price | $0, hard-capped daily quotas | Free monthly quotas, then metered |
| Firestore / Auth | ✅ (daily free quotas) | ✅ (same free quotas, then paid) |
| Storage | ❌ can't even be enabled (since Oct 2024) | ✅ required just to turn it on |
| Requires a billing account | No | Yes |

**This project runs entirely on Firebase Spark, using Auth + Firestore only.**
The only things that would force an upgrade to Blaze are hosting the app
itself on Firebase App Hosting/Cloud Run, making outbound network calls from
a Cloud Function, or wanting **Firebase Storage** specifically — as of
October 2024, Google requires Blaze (a card on file) just to enable Cloud
Storage for Firebase on a new project, regardless of actual usage. This
project sidesteps that entirely: the app is hosted on **Vercel** (a separate
product with its own free Hobby tier), and **Google Drive stands in for
Firebase Storage** as the file-hosting method — no card, no Blaze, anywhere in
this stack. See `DEPLOYMENT.md` §0–§3 for the full explanation.

| | **Vercel Hobby (free)** |
|---|---|
| Price | $0 |
| Bandwidth | 100 GB/month included |
| Serverless function executions | 100 GB-hours/month included |
| Custom domain + managed HTTPS | ✅ included |
| Automatic deploys on push | ✅ included |

Google Drive (the file-hosting method for this stack, standing in for Firebase
Storage) has its own separate free storage — 15 GB on a personal Google
account, more on a Google Workspace plan — and has no relationship to either
Vercel's or Firebase's billing at all. No card is ever required to use it at
the free tier.

---

## 2. Per-service cost drivers

| Service | Free tier | Beyond free tier (≈) | What drives it here |
|---|---|---|---|
| **Firestore reads** | 50K/day | Requires Blaze upgrade to exceed | Browsing the dashboard, subjects, resources (real-time listeners) |
| **Firestore writes** | 20K/day | Requires Blaze upgrade to exceed | Favourites, recently-viewed, download logs, admin edits |
| **Firestore storage** | 1 GiB | Requires Blaze upgrade to exceed | Small — metadata only (files live in Drive) |
| **Firebase Storage (stored/served)** | 5 GB / 1 GB per day | **Not usable at all without Blaze** (skip it — not part of this stack) | N/A in the card-free setup — Drive replaces it entirely |
| **Vercel bandwidth** | 100 GB/month | Vercel Pro plan ($20/mo) if exceeded | Serving pages, assets, and API responses |
| **Vercel function execution** | 100 GB-hours/month | Vercel Pro plan if exceeded | API routes + SSR page renders |
| **Authentication** | Unlimited | **$0**, ever | Custom-token sign-in has no per-verification cost on any plan |
| **Google Drive storage** | 15 GB (personal) / more (Workspace) | Google One / Workspace storage upgrade | The resource library (admin-shared PDFs, notes, videos) — the sole file-hosting mechanism in this stack |
| **Custom domain** | — | ~$10–15/**year** (registrar, not Vercel or Firebase) | You already own it |

**Takeaway:** every line item above has a **$0** free tier under normal
single-school usage, and there is no metered "pay beyond the limit" behavior
on Spark or Vercel Hobby — you simply hit the daily/monthly cap and would need
to upgrade the relevant plan (Blaze or Vercel Pro) to go further, rather than
being billed automatically.

---

## 3. Estimated monthly cost by cohort size

Modelling assumptions per active student: ~20 sessions/month, ~100 reads/session,
~30 writes/month, ~50 MB of file views/month. Resource library (entirely on
Google Drive in this setup) grows from ~10 GB to ~50 GB across the scales.

| Cohort | Firestore reads/writes | Google Drive storage | Vercel bandwidth | **Estimated total** |
|---|---|---|---|---|
| **100 users** | Within free tier | Within free tier | Within free tier | **$0/month** |
| **500 users** | Within free tier | Within free tier | Within free tier | **$0/month** |
| **1,000 users** | Within free tier | May approach personal Drive's 15 GB | Within free tier | **$0/month**, watch Drive storage |
| **5,000 users** | May approach Firestore read/write caps | Likely exceeds personal 15 GB — use Google Workspace storage | Likely within free tier | **$0/month if on Workspace storage**, otherwise a Google One upgrade may be needed |

At the realistic scale of a single MYP5 cohort (a few hundred students), the
entire deployment costs **$0/month** — only the domain, which you already own,
has a recurring cost (its annual registrar renewal, unrelated to hosting).

---

## 4. Cost-control levers (staying inside the free tiers)

1. **Cache and paginate reads.** The biggest read multiplier is real-time
   listeners re-reading whole collections. Prefer `getDocs` with pagination for
   large lists, and keep live `onSnapshot` listeners scoped (e.g. only the
   student's own tickets). This keeps most cohorts inside the free read quota.
2. **Compress before uploading to Drive.** Store scanned notes/past papers as
   compressed PDFs rather than raw scans — Drive's free tier (15 GB personal,
   more on Workspace) is the only storage budget in this stack, so keeping
   files lean stretches it further.
3. **YouTube for video, where possible.** The app already supports YouTube
   links with a dedicated preview — this removes video entirely from your
   Google Drive quota.
4. **Watch Vercel's bandwidth quota** if the cohort grows large — 100 GB/month
   is generous for a school app's traffic pattern (mostly text + small assets),
   but very large downloadable media served directly through the app (rather
   than as an external Drive/YouTube link) would count against it.

---

## 5. Recommendation

- **Use Firebase Spark (Auth + Firestore only) + Vercel Hobby + Google Drive**
  — this is the cost-optimal, genuinely card-free setup for a single-school
  deployment. No billing account on Firebase or Vercel, and Drive's free tier
  needs no card either.
- **Expected steady-state cost for a real MYP5 cohort (100–1,000 students):
  $0/month**, plus the amortised cost of the domain you already own.
- **If the school later expands** to multiple year-groups or several thousand
  students, monitor Firestore quotas in the Firebase Console and Drive storage
  usage — if you approach either, apply the cost-control levers in §4
  (compress files, prefer YouTube for video) or, if a card becomes available
  later, upgrade to Firebase Blaze and enable Storage for extra headroom.
- For abuse protection, consider **Firebase App Check** (see `SECURITY.md`) —
  it's free on Spark too.

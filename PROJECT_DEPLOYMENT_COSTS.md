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
| Firestore / Storage / Auth | ✅ (daily free quotas) | ✅ (same free quotas, then paid) |
| Requires a billing account | No | Yes |

**This project runs entirely on Firebase Spark.** The only things that would
force an upgrade to Blaze are hosting the app itself on Firebase App
Hosting/Cloud Run, or making outbound network calls from a Cloud Function —
this project does neither. The app is hosted on **Vercel** (a separate
product with its own free Hobby tier), Firebase is used only for
Auth/Firestore/Storage, and there are no Cloud Functions anywhere in the
codebase. See `DEPLOYMENT.md` §0 for the full explanation.

| | **Vercel Hobby (free)** |
|---|---|
| Price | $0 |
| Bandwidth | 100 GB/month included |
| Serverless function executions | 100 GB-hours/month included |
| Custom domain + managed HTTPS | ✅ included |
| Automatic deploys on push | ✅ included |

Google Drive (used only as optional supplementary storage for a handful of
large files) has its own separate free storage — 15 GB on a personal Google
account, more on a Google Workspace plan — and has no relationship to either
Vercel's or Firebase's billing at all.

---

## 2. Per-service cost drivers

| Service | Free tier | Beyond free tier (≈) | What drives it here |
|---|---|---|---|
| **Firestore reads** | 50K/day | Requires Blaze upgrade to exceed | Browsing the dashboard, subjects, resources (real-time listeners) |
| **Firestore writes** | 20K/day | Requires Blaze upgrade to exceed | Favourites, recently-viewed, download logs, admin edits |
| **Firestore storage** | 1 GiB | Requires Blaze upgrade to exceed | Small — metadata only (files live in Storage/Drive) |
| **Firebase Storage (stored)** | 5 GB | Requires Blaze upgrade to exceed | The resource library (admin-uploaded PDFs, notes, small videos) |
| **Firebase Storage (served)** | 1 GB/day | Requires Blaze upgrade to exceed | Students downloading/viewing files |
| **Vercel bandwidth** | 100 GB/month | Vercel Pro plan ($20/mo) if exceeded | Serving pages, assets, and API responses |
| **Vercel function execution** | 100 GB-hours/month | Vercel Pro plan if exceeded | API routes + SSR page renders |
| **Authentication** | Unlimited | **$0**, ever | Custom-token sign-in has no per-verification cost on any plan |
| **Google Drive storage** | 15 GB (personal) / more (Workspace) | Google One / Workspace storage upgrade | Only for large files an admin chooses to host on Drive instead of Firebase Storage |
| **Custom domain** | — | ~$10–15/**year** (registrar, not Vercel or Firebase) | You already own it |

**Takeaway:** every line item above has a **$0** free tier under normal
single-school usage, and there is no metered "pay beyond the limit" behavior
on Spark or Vercel Hobby — you simply hit the daily/monthly cap and would need
to upgrade the relevant plan (Blaze or Vercel Pro) to go further, rather than
being billed automatically.

---

## 3. Estimated monthly cost by cohort size

Modelling assumptions per active student: ~20 sessions/month, ~100 reads/session,
~30 writes/month, ~50 MB of file views/month. Resource library (Firebase
Storage + Drive combined) grows from ~10 GB to ~50 GB across the scales.

| Cohort | Firestore reads/writes | Storage served | Vercel bandwidth | **Estimated total** |
|---|---|---|---|---|
| **100 users** | Within free tier | Within free tier | Within free tier | **$0/month** |
| **500 users** | Within free tier | Within free tier | Within free tier | **$0/month** |
| **1,000 users** | Within free tier | Likely within free tier; monitor Storage served | Within free tier | **$0/month**, watch Storage quota |
| **5,000 users** | May approach Firestore read/write caps | May exceed the 1 GB/day Storage-served cap | Likely within free tier | **$0/month if you route large files through Drive/CDN**, otherwise a Firebase Blaze upgrade may be needed |

At the realistic scale of a single MYP5 cohort (a few hundred students), the
entire deployment costs **$0/month** — only the domain, which you already own,
has a recurring cost (its annual registrar renewal, unrelated to hosting).

---

## 4. Cost-control levers (staying inside the free tiers)

1. **Cache and paginate reads.** The biggest read multiplier is real-time
   listeners re-reading whole collections. Prefer `getDocs` with pagination for
   large lists, and keep live `onSnapshot` listeners scoped (e.g. only the
   student's own tickets). This keeps most cohorts inside the free read quota.
2. **Right-size media, and use Google Drive for the largest files.** Store
   scanned notes/past papers as compressed PDFs on Firebase Storage, and host
   large videos or big archive bundles on **Google Drive** as *links* (the app
   already supports external-link resources — see `DEPLOYMENT.md` §3) instead
   of uploading multi-hundred-MB files to Firebase Storage. This keeps Firebase
   Storage's 5 GB / 1 GB-per-day quotas free for everything else, since Drive
   storage and bandwidth are entirely separate from Firebase's quotas.
3. **YouTube for video, where possible.** The app already supports YouTube
   links with a dedicated preview — this removes video entirely from both your
   Firebase Storage and Google Drive quota.
4. **Watch Vercel's bandwidth quota** if the cohort grows large — 100 GB/month
   is generous for a school app's traffic pattern (mostly text + small assets),
   but very large downloadable media served directly through the app (rather
   than as an external Drive/YouTube link) would count against it.

---

## 5. Recommendation

- **Use Firebase Spark + Vercel Hobby + Google Drive** — this is the
  cost-optimal setup for a single-school deployment, and requires no billing
  account on Firebase or Vercel at all.
- **Expected steady-state cost for a real MYP5 cohort (100–1,000 students):
  $0/month**, plus the amortised cost of the domain you already own.
- **If the school later expands** to multiple year-groups or several thousand
  students, monitor the Firestore/Storage quotas in the Firebase Console — if
  you approach them, either apply the cost-control levers in §4 (particularly
  routing large media through Google Drive/YouTube) or upgrade to Firebase
  Blaze, which keeps the same free quotas and only meters usage beyond them.
- For abuse protection, consider **Firebase App Check** (see `SECURITY.md`) —
  it's free on Spark too.

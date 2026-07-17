/**
 * Standalone seed script — deliberately does NOT import from `src/lib/**`.
 * Those modules import the `server-only` marker package, which only
 * resolves to its no-op branch inside Next.js's own build (via the
 * "react-server" export condition); under plain `tsx` it throws. This
 * script re-implements the small bit of Admin SDK bootstrap + subject
 * seeding it needs instead of fighting that.
 *
 * Usage:
 *   npm run seed            # seed subjects only if the collection is empty
 *   npm run seed -- --reset # clear subjects + resource data, then reseed
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const SEED_SUBJECTS = [
  { name: "Language and Literature", slug: "language-and-literature", icon: "BookOpen", color: "chart-1", order: 0 },
  { name: "Math (Extended)", slug: "math-extended", icon: "MathOps", color: "chart-2", order: 1 },
  { name: "Math (Standard)", slug: "math-standard", icon: "Calculator", color: "chart-3", order: 2 },
  { name: "INS", slug: "ins", icon: "Globe2", color: "chart-4", order: 3 },
  { name: "Physics", slug: "physics", icon: "Atom", color: "chart-5", order: 4 },
  { name: "Chemistry", slug: "chemistry", icon: "FlaskConical", color: "chart-1", order: 5 },
  { name: "Biology", slug: "biology", icon: "Dna", color: "chart-2", order: 6 },
  { name: "Design", slug: "design", icon: "PenTool", color: "chart-3", order: 7 },
  { name: "Physical and Health Education", slug: "physical-and-health-education", icon: "Barbell", color: "chart-4", order: 8 },
  { name: "Visual Arts", slug: "visual-arts", icon: "Palette", color: "chart-5", order: 9 },
  { name: "Spanish", slug: "spanish", icon: "Languages", color: "chart-1", order: 10 },
  { name: "Hindi", slug: "hindi", icon: "Languages", color: "chart-2", order: 11 },
  { name: "French", slug: "french", icon: "Languages", color: "chart-3", order: 12 },
  { name: "German", slug: "german", icon: "Languages", color: "chart-4", order: 13 },
  { name: "Personal Project", slug: "personal-project", icon: "Compass", color: "chart-5", order: 14 },
  { name: "School Books (IB MYP PDFs)", slug: "school-books", icon: "Books", color: "chart-1", order: 15 },
];

function initAdmin() {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  const isEmulator = Boolean(
    process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST
  );

  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID is not set. Copy .env.example to .env.local first.");
  }

  if (isEmulator) {
    return initializeApp({ projectId, storageBucket });
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey || !storageBucket) {
    throw new Error(
      "Firebase Admin credentials are missing. Set FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY " +
        "and FIREBASE_STORAGE_BUCKET in .env.local, or run against the emulator instead."
    );
  }
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), storageBucket });
}

async function clearCollection(db: Firestore, name: string): Promise<number> {
  const snap = await db.collection(name).get();
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
}

async function seedSubjects(db: Firestore) {
  const collection = db.collection("subjects");
  const batch = db.batch();
  const now = new Date();
  for (const subject of SEED_SUBJECTS) {
    batch.set(collection.doc(subject.slug), { ...subject, topics: [], createdAt: now, updatedAt: now });
  }
  await batch.commit();
  console.log(`Seed complete — ${SEED_SUBJECTS.length} subjects created:`);
  for (const subject of SEED_SUBJECTS) {
    console.log(`  ${subject.order + 1}. ${subject.name} (${subject.slug})`);
  }
}

async function main() {
  const reset = process.argv.includes("--reset");
  const app = initAdmin();
  const db = getFirestore(app);

  if (reset) {
    console.log("Resetting subjects + resource data…");
    for (const c of ["subjects", "resources", "favorites", "recentViews", "downloads"]) {
      const n = await clearCollection(db, c);
      console.log(`  cleared ${n} docs from ${c}`);
    }
    await seedSubjects(db);
    return;
  }

  const existing = await db.collection("subjects").limit(1).get();
  if (!existing.empty) {
    const all = await db.collection("subjects").get();
    console.log(`Already seeded — ${all.size} subjects in Firestore. Run with --reset to replace.`);
    return;
  }
  await seedSubjects(db);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });

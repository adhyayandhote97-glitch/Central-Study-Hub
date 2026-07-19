import "server-only";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Local development can run entirely against the Firebase Local Emulator
 * Suite (see .env.local / firebase.json) — no real project needed. The
 * Admin SDK auto-routes Firestore/Auth/Storage traffic to the emulators
 * whenever these host env vars are present, regardless of which credential
 * (real or not) was used to initialize the app.
 */
function isEmulatorMode(): boolean {
  return Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);
}

/**
 * Lazily initializes the Firebase Admin SDK on first use inside a request
 * handler. Never call this at module top-level — without credentials present
 * (e.g. during `next build`, before the user has configured Firebase) this
 * throws, and a top-level call would take down the entire build.
 */
function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (isEmulatorMode()) {
    if (!projectId) {
      throw new Error("FIREBASE_PROJECT_ID is required even in emulator mode. See .env.example.");
    }
    // A credential is optional for Firestore/Auth/Storage reads+writes in
    // emulator mode, but Storage's getSignedUrl() always needs a private key
    // to sign with (even against the emulator, which never verifies the
    // signature against real Google infrastructure) — use one if provided.
    if (clientEmail && privateKey) {
      return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), storageBucket });
    }
    return initializeApp({ projectId, storageBucket });
  }

  // storageBucket is intentionally NOT required here — Storage is optional
  // (see isFirebaseStorageConfigured below). Auth and Firestore have no
  // dependency on it and must be able to initialize without it.
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, " +
        "and FIREBASE_PRIVATE_KEY in your environment. See .env.example."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket,
  });
}

let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let storageInstance: Storage | undefined;

export function getAdminAuth(): Auth {
  if (!authInstance) authInstance = getAuth(getAdminApp());
  return authInstance;
}

export function getAdminDb(): Firestore {
  if (!dbInstance) dbInstance = getFirestore(getAdminApp());
  return dbInstance;
}

export function getAdminStorage(): Storage {
  if (!storageInstance) storageInstance = getStorage(getAdminApp());
  return storageInstance;
}

/** Whether Firebase Admin is usable in this environment (real credentials or emulators). */
export function isFirebaseAdminConfigured(): boolean {
  if (isEmulatorMode()) return Boolean(process.env.FIREBASE_PROJECT_ID);
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

/**
 * Whether Firebase Storage is usable — separate from Auth/Firestore because
 * Storage requires the Blaze plan on new Firebase projects (a card on file),
 * while Auth/Firestore stay free on Spark. Upload routes must check this
 * explicitly rather than assuming Storage is always available.
 */
export function isFirebaseStorageConfigured(): boolean {
  return Boolean(process.env.FIREBASE_STORAGE_BUCKET);
}

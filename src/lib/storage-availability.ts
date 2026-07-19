/**
 * Client-safe check for whether Firebase Storage is configured on this
 * deployment. Firebase Storage now requires the Blaze plan on new projects,
 * so a card-free deployment may run Auth + Firestore only, with file
 * uploads disabled in favor of Link resources (Google Drive/YouTube/etc).
 * Reuses the existing NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET var — no new env
 * var or API round-trip needed, since NEXT_PUBLIC_* vars are inlined at
 * build time.
 */
export function isStorageAvailableClient(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
}

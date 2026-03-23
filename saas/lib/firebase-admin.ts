import type { Messaging } from "firebase-admin/messaging";

let _messaging: Messaging | null = null;

export function adminMessaging(): Messaging {
  if (_messaging) return _messaging;

  const adminKey = process.env.FIREBASE_ADMIN_KEY;
  if (!adminKey) throw new Error("FIREBASE_ADMIN_KEY not configured");

  // Lazy import to avoid loading firebase-admin in client bundles
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const admin = require("firebase-admin");

  if (admin.apps.length === 0) {
    const serviceAccount = JSON.parse(adminKey);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  _messaging = admin.messaging();
  return _messaging!;
}

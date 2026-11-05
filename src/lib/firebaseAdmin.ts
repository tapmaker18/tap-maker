import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_ROLE } from "@/lib/admin";

const ADMIN_APP_NAME = "tap-maker-admin";

function getServiceAccount() {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (rawServiceAccount) {
    try {
      const parsed = JSON.parse(rawServiceAccount);
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
    }
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }

  return { projectId, clientEmail, privateKey };
}

export function getFirebaseAdminApp(): App {
  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME);
  if (existing) return existing;

  const serviceAccount = getServiceAccount();
  return initializeApp(
    {
      credential: cert(serviceAccount),
    },
    ADMIN_APP_NAME
  );
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

function getBearerToken(request: Request): string {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing Firebase ID token.");
  }
  return authorization.slice("Bearer ".length);
}

export async function verifyAuthenticatedRequest(request: Request): Promise<DecodedIdToken> {
  return getAdminAuth().verifyIdToken(getBearerToken(request));
}

export async function verifyAdminRequest(request: Request): Promise<DecodedIdToken> {
  const decoded = await verifyAuthenticatedRequest(request);
  if (decoded.role !== SUPER_ADMIN_ROLE) {
    throw new Error("Super Admin access is required.");
  }
  return decoded;
}

/**
 * The one-time bootstrap path is deliberately limited to the verified owner
 * address. All routine authorization uses the immutable custom admin claim.
 */
export async function bootstrapAdminClaim(request: Request): Promise<void> {
  const decoded = await verifyAuthenticatedRequest(request);
  if (
    decoded.email?.toLowerCase() !== SUPER_ADMIN_EMAIL ||
    decoded.email_verified !== true
  ) {
    throw new Error("A verified Super Admin email address is required.");
  }

  const auth = getAdminAuth();
  const user = await auth.getUser(decoded.uid);
  await auth.setCustomUserClaims(decoded.uid, {
    ...(user.customClaims || {}),
    role: SUPER_ADMIN_ROLE,
  });

  // Keep the owner document in sync as well. The custom claim is the source of
  // authorization; this document only drives the member-management interface.
  const now = new Date().toISOString();
  await getAdminDb()
    .collection("users")
    .doc(decoded.uid)
    .set(
      {
        uid: decoded.uid,
        email: decoded.email,
        businessName: user.displayName || "Tap-Maker Studio (Super Admin)",
        contactName: "Adrian Calicdan",
        status: "approved",
        role: SUPER_ADMIN_ROLE,
        aiScansLimit: 999999,
        aiScansUsed: 0,
        createdAt: now,
        approvedAt: now,
      },
      { merge: true }
    );
}

import { NextResponse } from "next/server";
import { getAdminDb, verifyAuthenticatedRequest } from "@/lib/firebaseAdmin";
import { SUPER_ADMIN_ROLE } from "@/lib/admin";
import { MAX_DOC_BYTES, getDocSizeBytes } from "@/lib/docSize";

export const runtime = "nodejs";

/**
 * Server-side guard for creating profiles/menus and checking slug availability.
 * - Enforces card token limits (cannot be bypassed from the browser).
 * - Checks slug uniqueness with the Admin SDK (client-side queries are blocked by rules).
 */

type AssetType = "profile" | "menu";

const COLLECTION: Record<AssetType, string> = { profile: "profiles", menu: "menus" };

const RESERVED: Record<AssetType, string[]> = {
  profile: [
    "dashboard", "editor", "login", "api", "templates", "settings", "admin", "public",
    "favicon", "sitemap", "robots", "terms", "privacy", "pricing", "about", "menu", "new", "_next",
  ],
  menu: ["new", "editor", "admin", "api", "settings"],
};

class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

function asType(value: unknown): AssetType {
  if (value === "profile" || value === "menu") return value;
  throw new ApiError("Invalid asset type.", 400);
}

function cleanSlug(value: unknown): string {
  if (typeof value !== "string") throw new ApiError("Slug is required.", 400);
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
  if (!slug) throw new ApiError("Slug is required.", 400);
  return slug;
}

async function slugTaken(type: AssetType, slug: string, excludeId?: string): Promise<boolean> {
  if (RESERVED[type].includes(slug)) return true;
  const snap = await getAdminDb().collection(COLLECTION[type]).where("slug", "==", slug).get();
  return snap.docs.some((d) => d.id !== excludeId);
}

export async function POST(request: Request) {
  try {
    const decoded = await verifyAuthenticatedRequest(request);
    const isAdmin = decoded.role === SUPER_ADMIN_ROLE;
    const body = (await request.json()) as Record<string, unknown>;
    const db = getAdminDb();
    const type = asType(body.type);

    if (body.action === "check-slug") {
      const slug = cleanSlug(body.slug);
      const excludeId = typeof body.excludeId === "string" ? body.excludeId : undefined;
      return NextResponse.json({ available: !(await slugTaken(type, slug, excludeId)) });
    }

    if (body.action === "create") {
      const data = body.data as Record<string, unknown> | undefined;
      if (!data || typeof data !== "object" || typeof data.id !== "string" || !data.id) {
        throw new ApiError("Invalid asset data.", 400);
      }
      if (!/^[A-Za-z0-9_-]{1,80}$/.test(data.id)) {
        throw new ApiError("Invalid asset ID.", 400);
      }

      const slug = cleanSlug(data.slug);
      const now = new Date().toISOString();
      const doc: Record<string, unknown> = {
        ...data,
        slug,
        userId: decoded.uid,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      };

      if (getDocSizeBytes(doc) > MAX_DOC_BYTES) {
        throw new ApiError("Document size exceeds the 1 MB limit. Please reduce or compress your images.", 413);
      }

      const userRef = db.collection("users").doc(decoded.uid);
      const assetRef = db.collection(COLLECTION[type]).doc(data.id);

      await db.runTransaction(async (tx) => {
        const existing = await tx.get(assetRef);
        if (existing.exists) throw new ApiError("This ID already exists.", 409);

        const slugSnap = await tx.get(
          db.collection(COLLECTION[type]).where("slug", "==", slug).limit(1)
        );
        if (!slugSnap.empty || RESERVED[type].includes(slug)) {
          throw new ApiError(`Slug "${slug}" is already taken.`, 409);
        }

        if (!isAdmin) {
          const userSnap = await tx.get(userRef);
          const account = userSnap.data();
          if (!userSnap.exists || account?.status !== "approved" || account?.role === "customer") {
            throw new ApiError("Your account is not authorized to create new profiles or menus.", 403);
          }

          const [profilesSnap, menusSnap] = await Promise.all([
            tx.get(db.collection("profiles").where("userId", "==", decoded.uid)),
            tx.get(db.collection("menus").where("userId", "==", decoded.uid)),
          ]);
          const used = profilesSnap.size + menusSnap.size;
          const limit = typeof account.cardTokensLimit === "number" ? account.cardTokensLimit : 1;
          if (used >= limit) {
            throw new ApiError(
              `Card Token Limit Reached! You have used all ${limit} digital slot(s) (${profilesSnap.size} profiles, ${menusSnap.size} menus). Contact the Super Admin to order more cards.`,
              403
            );
          }
        }

        tx.set(assetRef, doc);
      });

      return NextResponse.json({ asset: doc }, { status: 201 });
    }

    throw new ApiError("Unknown action.", 400);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unexpected error.";
    const status = message.includes("ID token") || message.includes("auth") ? 401 : 500;
    console.error("Assets API error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}

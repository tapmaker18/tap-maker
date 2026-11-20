import { NextResponse } from "next/server";
import { getAdminDb, verifyAuthenticatedRequest } from "@/lib/firebaseAdmin";
import {
  ApiError,
  applyCustomerChanges,
  assertCustomer,
  diffMenu,
  resolveCaller,
} from "@/lib/customerServer";
import { MAX_DOC_BYTES, getDocSizeBytes } from "@/lib/docSize";
import type { CustomerPreset, Menu } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Customer-facing menu API. Customers never write to Firestore directly;
 * every change goes through here so permissions, conflicts and the changelog
 * are enforced on the server.
 */

async function getAccess(menuId: string, uid: string): Promise<CustomerPreset> {
  const snap = await getAdminDb().collection("menuAccess").doc(menuId).get();
  const data = snap.data();
  if (!snap.exists || !(data?.editorIds || []).includes(uid)) {
    throw new ApiError("You do not have access to this menu.", 403);
  }
  return data?.editors?.[uid] === "quick_edit" ? "quick_edit" : "content";
}

export async function POST(request: Request) {
  try {
    const decoded = await verifyAuthenticatedRequest(request);
    const caller = await resolveCaller(decoded);
    assertCustomer(caller);
    const db = getAdminDb();
    const body = (await request.json()) as Record<string, unknown>;

    if (body.action === "list") {
      const accessSnap = await db.collection("menuAccess").where("editorIds", "array-contains", caller.uid).get();
      const menus = await Promise.all(
        accessSnap.docs.map(async (a) => {
          const m = await db.collection("menus").doc(a.id).get();
          if (!m.exists) return null;
          const d = m.data() as Menu;
          const itemCount = (d.categories || []).reduce((n, c) => n + (c.items?.length || 0), 0);
          const soldOut = (d.categories || []).reduce(
            (n, c) => n + (c.items || []).filter((i) => !i.isAvailable).length,
            0
          );
          return {
            id: m.id,
            businessName: d.businessName,
            tagline: d.tagline || "",
            slug: d.slug,
            status: d.status,
            logoUrl: d.logoUrl || "",
            updatedAt: d.updatedAt,
            itemCount,
            soldOut,
            preset: a.data().editors?.[caller.uid] || "content",
          };
        })
      );
      return NextResponse.json({ menus: menus.filter(Boolean) });
    }

    const menuId = typeof body.menuId === "string" ? body.menuId : "";
    if (!menuId) throw new ApiError("Menu is required.", 400);
    const preset = await getAccess(menuId, caller.uid);
    const menuRef = db.collection("menus").doc(menuId);

    if (body.action === "get") {
      const snap = await menuRef.get();
      if (!snap.exists) throw new ApiError("Menu not found.", 404);
      const logSnap = await menuRef.collection("changelog").orderBy("createdAt", "desc").limit(30).get();
      return NextResponse.json({
        menu: { ...snap.data(), id: snap.id },
        preset,
        changelog: logSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      });
    }

    if (body.action === "save") {
      const data = (body.data || {}) as Record<string, unknown>;
      const expectedUpdatedAt = typeof body.expectedUpdatedAt === "string" ? body.expectedUpdatedAt : null;

      const result = await db.runTransaction(async (tx) => {
        const snap = await tx.get(menuRef);
        if (!snap.exists) throw new ApiError("Menu not found.", 404);
        const current = { ...(snap.data() as Menu), id: snap.id };

        if (expectedUpdatedAt && current.updatedAt !== expectedUpdatedAt) {
          throw new ApiError(
            "This menu was updated in another session while you had it open. Please reload the page to get the latest version before saving.",
            409
          );
        }

        const updates = applyCustomerChanges(current, data, preset);
        const changes = diffMenu(current, updates, current.themeSettings?.currency || "₱");
        if (changes.length === 0) return { menu: current, changes };

        const now = new Date().toISOString();
        const next = { ...current, ...updates, updatedAt: now, updatedBy: caller.uid };
        const clean = JSON.parse(JSON.stringify(next));
        if (getDocSizeBytes(clean) > MAX_DOC_BYTES) {
          throw new ApiError("Menu data exceeds the 1 MB limit. Please reduce or compress item photos.", 413);
        }

        tx.set(menuRef, clean);
        tx.set(menuRef.collection("changelog").doc(), {
          menuId,
          actorUid: caller.uid,
          actorEmail: caller.email || "",
          actorRole: "customer",
          changes,
          createdAt: now,
        });
        return { menu: clean, changes };
      });

      return NextResponse.json(result);
    }

    throw new ApiError("Unknown action.", 400);
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("Customer menus API error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

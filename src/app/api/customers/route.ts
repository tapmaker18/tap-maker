import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb, verifyAuthenticatedRequest } from "@/lib/firebaseAdmin";
import { ApiError, asPreset, assertClientOrAdmin, resolveCaller, type Caller } from "@/lib/customerServer";

export const runtime = "nodejs";

/**
 * Client → Customer account management.
 * Callers: approved clients (manage their own customers) and the Super Admin (all).
 * Customer seats per client = client's cardTokensLimit.
 */

function reqStr(v: unknown, field: string): string {
  if (typeof v !== "string" || !v.trim()) throw new ApiError(`${field} is required.`, 400);
  return v.trim();
}

async function getOwnedMenu(caller: Caller, menuId: string): Promise<Record<string, any>> {
  const snap = await getAdminDb().collection("menus").doc(menuId).get();
  if (!snap.exists) throw new ApiError("Menu not found.", 404);
  const menu = snap.data() as Record<string, any>;
  if (!caller.isAdmin && menu.userId !== caller.uid) {
    throw new ApiError("You can only hand over menus that you own.", 403);
  }
  return { id: snap.id, ...menu };
}

async function getManagedCustomer(caller: Caller, customerUid: string) {
  const snap = await getAdminDb().collection("users").doc(customerUid).get();
  const data = snap.data();
  if (!snap.exists || data?.role !== "customer") throw new ApiError("Customer not found.", 404);
  if (!caller.isAdmin && data.parentClientId !== caller.uid) {
    throw new ApiError("This customer belongs to another client.", 403);
  }
  return data as Record<string, any>;
}

async function grantAccess(menu: Record<string, any>, customerUid: string, preset: string) {
  await getAdminDb()
    .collection("menuAccess")
    .doc(menu.id)
    .set(
      {
        menuId: menu.id,
        ownerId: menu.userId,
        editorIds: FieldValue.arrayUnion(customerUid),
        editors: { [customerUid]: preset },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
}

async function revokeAccess(menuId: string, customerUid: string) {
  await getAdminDb()
    .collection("menuAccess")
    .doc(menuId)
    .set(
      {
        editorIds: FieldValue.arrayRemove(customerUid),
        editors: { [customerUid]: FieldValue.delete() },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
}

async function makeSetupLink(email: string, request: Request): Promise<string | null> {
  const auth = getAdminAuth();
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";
  try {
    if (origin) {
      return await auth.generatePasswordResetLink(email, { url: `${origin}/login` });
    }
  } catch (err) {
    console.warn("Setup link with continue URL failed, retrying without:", err);
  }
  try {
    return await auth.generatePasswordResetLink(email);
  } catch (err) {
    console.error("Unable to generate setup link:", err);
    return null;
  }
}

async function countSeats(clientUid: string): Promise<number> {
  const snap = await getAdminDb().collection("users").where("parentClientId", "==", clientUid).get();
  return snap.docs.filter((d) => d.data().role === "customer").length;
}

export async function POST(request: Request) {
  try {
    const decoded = await verifyAuthenticatedRequest(request);
    const caller = await resolveCaller(decoded);
    assertClientOrAdmin(caller);

    const body = (await request.json()) as Record<string, unknown>;
    const db = getAdminDb();
    const auth = getAdminAuth();
    const action = body.action;

    // ── List customers + their menu access ──────────────────────
    if (action === "list") {
      const usersSnap = caller.isAdmin
        ? await db.collection("users").where("role", "==", "customer").get()
        : await db.collection("users").where("parentClientId", "==", caller.uid).get();
      const customers = usersSnap.docs
        .map((d) => d.data() as Record<string, any>)
        .filter((u) => u.role === "customer");

      const accessSnap = caller.isAdmin
        ? await db.collection("menuAccess").get()
        : await db.collection("menuAccess").where("ownerId", "==", caller.uid).get();

      const menuIds = accessSnap.docs.map((d) => d.id);
      const menuInfo = new Map<string, { businessName: string; slug: string; status: string }>();
      await Promise.all(
        menuIds.map(async (id) => {
          const m = await db.collection("menus").doc(id).get();
          if (m.exists) {
            const d = m.data() as Record<string, any>;
            menuInfo.set(id, { businessName: d.businessName, slug: d.slug, status: d.status });
          }
        })
      );

      const result = customers.map((c) => ({
        uid: c.uid,
        email: c.email,
        businessName: c.businessName,
        contactName: c.contactName || "",
        status: c.status,
        parentClientId: c.parentClientId || null,
        createdAt: c.createdAt,
        lastLoginAt: c.lastLoginAt || null,
        menus: accessSnap.docs
          .filter((a) => (a.data().editorIds || []).includes(c.uid) && menuInfo.has(a.id))
          .map((a) => ({
            menuId: a.id,
            preset: a.data().editors?.[c.uid] || "content",
            ...menuInfo.get(a.id)!,
          })),
      }));

      const limit = caller.isAdmin ? null : caller.account?.cardTokensLimit ?? 1;
      return NextResponse.json({
        customers: result,
        seats: { used: caller.isAdmin ? result.length : customers.length, limit },
      });
    }

    // ── View customer edit changelog for a menu ─────────────────
    if (action === "changelog") {
      const menuId = reqStr(body.menuId, "Menu");
      await getOwnedMenu(caller, menuId);
      const logSnap = await db
        .collection("menus")
        .doc(menuId)
        .collection("changelog")
        .orderBy("createdAt", "desc")
        .limit(40)
        .get();
      return NextResponse.json({
        changelog: logSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      });
    }

    // ── Create (or reuse) a customer and hand over a menu ───────
    if (action === "create") {
      const email = reqStr(body.email, "Email").toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError("Invalid email address.", 400);
      const businessName = reqStr(body.businessName, "Business name");
      const contactName = typeof body.contactName === "string" ? body.contactName.trim() : "";
      const menu = await getOwnedMenu(caller, reqStr(body.menuId, "Menu"));
      const preset = asPreset(body.preset);
      const parentClientId = caller.isAdmin ? menu.userId : caller.uid;

      let existing = null;
      try {
        existing = await auth.getUserByEmail(email);
      } catch {
        existing = null;
      }

      let customerUid: string;
      let reused = false;

      if (existing) {
        const doc = await db.collection("users").doc(existing.uid).get();
        const data = doc.data();
        if (!doc.exists || data?.role !== "customer" || data.parentClientId !== parentClientId) {
          throw new ApiError("This email is already registered to another account.", 409);
        }
        customerUid = existing.uid;
        reused = true;
      } else {
        if (!caller.isAdmin) {
          const used = await countSeats(caller.uid);
          const limit = caller.account?.cardTokensLimit ?? 1;
          if (used >= limit) {
            throw new ApiError(
              `Customer seat limit reached (${used}/${limit}). 1 card token = 1 customer seat. Contact the Super Admin for more.`,
              403
            );
          }
        }

        const created = await auth.createUser({
          email,
          password: randomBytes(18).toString("base64url"),
          displayName: contactName || businessName,
        });
        customerUid = created.uid;
        try {
          await auth.setCustomUserClaims(customerUid, { role: "customer", parentClientId });
          const now = new Date().toISOString();
          await db.collection("users").doc(customerUid).set({
            uid: customerUid,
            email,
            businessName,
            contactName,
            status: "approved",
            role: "customer",
            parentClientId,
            aiScansLimit: 0,
            aiScansUsed: 0,
            cardTokensLimit: 0,
            allowAiPageBuilder: false,
            createdAt: now,
            approvedAt: now,
            createdBy: caller.uid,
          });
        } catch (err) {
          await auth.deleteUser(customerUid).catch(() => undefined);
          throw err;
        }
      }

      await grantAccess(menu, customerUid, preset);
      const setupLink = reused ? null : await makeSetupLink(email, request);
      return NextResponse.json({ ok: true, customerUid, reused, setupLink }, { status: 201 });
    }

    const customerUid = reqStr(body.customerUid, "Customer");
    const customer = await getManagedCustomer(caller, customerUid);

    if (action === "assign") {
      const menu = await getOwnedMenu(caller, reqStr(body.menuId, "Menu"));
      if (!caller.isAdmin && menu.userId !== customer.parentClientId) {
        throw new ApiError("Menu and customer must belong to the same client.", 403);
      }
      await grantAccess(menu, customerUid, asPreset(body.preset));
      return NextResponse.json({ ok: true });
    }

    if (action === "unassign") {
      const menuId = reqStr(body.menuId, "Menu");
      await getOwnedMenu(caller, menuId);
      await revokeAccess(menuId, customerUid);
      return NextResponse.json({ ok: true });
    }

    if (action === "setup-link") {
      const link = await makeSetupLink(customer.email, request);
      if (!link) throw new ApiError("Unable to generate a setup link right now.", 502);
      return NextResponse.json({ setupLink: link });
    }

    if (action === "set-status") {
      const status = body.status === "suspended" ? "suspended" : "approved";
      await db.collection("users").doc(customerUid).update({ status });
      return NextResponse.json({ ok: true, status });
    }

    if (action === "delete") {
      const accessSnap = await db.collection("menuAccess").where("editorIds", "array-contains", customerUid).get();
      await Promise.all(accessSnap.docs.map((d) => revokeAccess(d.id, customerUid)));
      await db.collection("users").doc(customerUid).delete();
      await auth.deleteUser(customerUid).catch(() => undefined);
      return NextResponse.json({ ok: true });
    }

    throw new ApiError("Unknown action.", 400);
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("Customers API error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

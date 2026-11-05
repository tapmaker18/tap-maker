import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb, verifyAdminRequest } from "@/lib/firebaseAdmin";
import type { AccountStatus, MemberAccount } from "@/lib/types";

export const runtime = "nodejs";

const ACCOUNT_STATUSES: AccountStatus[] = ["pending", "approved", "suspended"];

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function asRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }
  return value.trim();
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdminRequest(request);
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action;
    const db = getAdminDb();
    const auth = getAdminAuth();

    if (action === "create") {
      const email = asRequiredString(body.email, "Email").toLowerCase();
      const password = asRequiredString(body.password, "Password");
      const businessName = asRequiredString(body.businessName, "Business name");
      const phone = typeof body.phone === "string" ? body.phone.trim() : "";
      const orderRef = typeof body.orderRef === "string" ? body.orderRef.trim() : "";
      const aiScansLimit =
        typeof body.aiScansLimit === "number" &&
        Number.isInteger(body.aiScansLimit) &&
        body.aiScansLimit >= 0 &&
        body.aiScansLimit <= 1000
          ? body.aiScansLimit
          : 5;

      const cardTokensLimit =
        typeof body.cardTokensLimit === "number" &&
        Number.isInteger(body.cardTokensLimit) &&
        body.cardTokensLimit >= 1 &&
        body.cardTokensLimit <= 10000
          ? body.cardTokensLimit
          : 1;

      if (password.length < 6) {
        return jsonError("Password must be at least 6 characters.");
      }

      const createdUser = await auth.createUser({ email, password });
      const now = new Date().toISOString();
      const member: MemberAccount = {
        uid: createdUser.uid,
        email,
        businessName,
        phone,
        orderRef,
        status: "approved",
        role: "member",
        aiScansLimit,
        aiScansUsed: 0,
        cardTokensLimit,
        createdAt: now,
        approvedAt: now,
      };

      try {
        await db.collection("users").doc(member.uid).set(member);
      } catch (error) {
        await auth.deleteUser(createdUser.uid).catch(() => undefined);
        throw error;
      }

      return NextResponse.json({ member }, { status: 201 });
    }

    const uid = asRequiredString(body.uid, "Member ID");
    if (uid === admin.uid) {
      return jsonError("The Super Admin account cannot be modified from this screen.", 403);
    }

    if (action === "set-status") {
      const status = body.status;
      if (typeof status !== "string" || !ACCOUNT_STATUSES.includes(status as AccountStatus)) {
        return jsonError("Invalid account status.");
      }

      const updates: Record<string, unknown> = { status };
      if (status === "approved") updates.approvedAt = new Date().toISOString();
      await db.collection("users").doc(uid).update(updates);
      return NextResponse.json({ ok: true });
    }

    if (action === "set-card-tokens") {
      const tokens = body.tokens;
      if (
        typeof tokens !== "number" ||
        !Number.isInteger(tokens) ||
        tokens < 1 ||
        tokens > 10000
      ) {
        return jsonError("Card tokens must be a whole number between 1 and 10,000.");
      }
      await db.collection("users").doc(uid).update({ cardTokensLimit: tokens });
      return NextResponse.json({ ok: true });
    }

    if (action === "add-card-tokens") {
      const count = body.count;
      if (
        typeof count !== "number" ||
        !Number.isInteger(count) ||
        count < 1 ||
        count > 10000
      ) {
        return jsonError("Card token top-up must be a whole number between 1 and 10,000.");
      }
      await db
        .collection("users")
        .doc(uid)
        .update({ cardTokensLimit: FieldValue.increment(count) });
      return NextResponse.json({ ok: true });
    }

    if (action === "add-ai-scans") {
      const count = body.count;
      if (
        typeof count !== "number" ||
        !Number.isInteger(count) ||
        count < 1 ||
        count > 1000
      ) {
        return jsonError("AI scan top-up must be a whole number between 1 and 1000.");
      }
      await db
        .collection("users")
        .doc(uid)
        .update({ aiScansLimit: FieldValue.increment(count) });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      const [profiles, menus] = await Promise.all([
        db.collection("profiles").where("userId", "==", uid).get(),
        db.collection("menus").where("userId", "==", uid).get(),
      ]);
      const batch = db.batch();
      profiles.docs.forEach((document) => batch.delete(document.ref));
      menus.docs.forEach((document) => batch.delete(document.ref));
      batch.delete(db.collection("users").doc(uid));
      await batch.commit();
      await auth.deleteUser(uid);
      return NextResponse.json({ ok: true });
    }

    return jsonError("Unsupported member action.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to manage the member account.";
    const status =
      message.includes("Missing Firebase ID token") ||
      message.includes("Super Admin access")
        ? 403
        : 500;
    return jsonError(message, status);
  }
}

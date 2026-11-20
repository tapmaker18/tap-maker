import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { SUPER_ADMIN_ROLE } from "@/lib/admin";
import type { Menu, MenuCategory, MenuContactInfo, MenuActionButton, CustomerPreset } from "@/lib/types";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export const CUSTOMER_PRESETS: CustomerPreset[] = ["content", "quick_edit"];

export function asPreset(value: unknown): CustomerPreset {
  return value === "quick_edit" ? "quick_edit" : "content";
}

export interface Caller {
  uid: string;
  email?: string;
  isAdmin: boolean;
  role: string;
  account: Record<string, any> | null;
}

export async function resolveCaller(decoded: DecodedIdToken): Promise<Caller> {
  const isAdmin = decoded.role === SUPER_ADMIN_ROLE;
  const snap = await getAdminDb().collection("users").doc(decoded.uid).get();
  const account = snap.exists ? (snap.data() as Record<string, any>) : null;
  return {
    uid: decoded.uid,
    email: decoded.email,
    isAdmin,
    role: isAdmin ? SUPER_ADMIN_ROLE : account?.role || "member",
    account,
  };
}

/** Client (approved member) or Super Admin. */
export function assertClientOrAdmin(caller: Caller) {
  if (caller.isAdmin) return;
  if (!caller.account || caller.role !== "member" || caller.account.status !== "approved") {
    throw new ApiError("Only approved client accounts can manage customers.", 403);
  }
}

/** Approved customer. Customers keep access even if their client is suspended. */
export function assertCustomer(caller: Caller) {
  if (!caller.account || caller.role !== "customer") {
    throw new ApiError("Customer access only.", 403);
  }
  if (caller.account.status !== "approved") {
    throw new ApiError("Your customer account is currently disabled. Please contact your provider.", 403);
  }
}

// ── Sanitizers ────────────────────────────────────────────────────

const str = (v: unknown, max = 500): string => (typeof v === "string" ? v.slice(0, max) : "");
const optStr = (v: unknown, max = 500): string | undefined =>
  typeof v === "string" && v.trim() ? v.slice(0, max) : undefined;
const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
};

function sanitizeCategories(input: unknown, existing: MenuCategory[], currency: string): MenuCategory[] {
  if (!Array.isArray(input)) throw new ApiError("Invalid categories.", 400);
  const existingItems = new Map<string, any>();
  existing.forEach((c) => c.items.forEach((i) => existingItems.set(i.id, i)));

  return input.slice(0, 50).map((rawCat: any, ci: number) => {
    const items = Array.isArray(rawCat?.items) ? rawCat.items : [];
    return {
      id: str(rawCat?.id, 80) || `cat-${Date.now()}-${ci}`,
      name: str(rawCat?.name, 120) || "Untitled",
      icon: optStr(rawCat?.icon, 16),
      isVisible: rawCat?.isVisible !== false,
      sortOrder: ci,
      items: items.slice(0, 200).map((rawItem: any, ii: number) => {
        const prev = existingItems.get(rawItem?.id);
        // Only accept image values that are data URLs/https or unchanged
        const image =
          typeof rawItem?.image === "string" &&
          (rawItem.image.startsWith("data:image/") || rawItem.image.startsWith("https://"))
            ? rawItem.image
            : prev?.image;
        const tags = Array.isArray(rawItem?.tags)
          ? rawItem.tags.filter((t: unknown) => typeof t === "string").slice(0, 10)
          : prev?.tags;
        const item: any = {
          id: str(rawItem?.id, 80) || `item-${Date.now()}-${ci}-${ii}`,
          name: str(rawItem?.name, 120) || "Untitled item",
          description: optStr(rawItem?.description, 400),
          price: num(rawItem?.price),
          currency: str(rawItem?.currency, 8) || prev?.currency || currency,
          isAvailable: rawItem?.isAvailable !== false,
          isFeatured: Boolean(rawItem?.isFeatured),
          sortOrder: ii,
        };
        if (image) item.image = image;
        if (tags) item.tags = tags;
        if (item.description === undefined) delete item.description;
        return item;
      }),
    } as MenuCategory;
  });
}

function sanitizeContact(input: unknown): MenuContactInfo {
  const c = (input || {}) as Record<string, unknown>;
  const out: MenuContactInfo = {};
  (["phone", "address", "openingHours", "instagram", "facebook", "website"] as const).forEach((k) => {
    const v = optStr(c[k], 300);
    if (v) out[k] = v;
  });
  return out;
}

function sanitizeButtons(input: unknown): MenuActionButton[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 12).map((b: any, i: number) => {
    const btn: MenuActionButton = {
      id: str(b?.id, 80) || `btn-${Date.now()}-${i}`,
      title: str(b?.title, 80) || "Button",
      url: str(b?.url, 500) || "#",
    };
    if (optStr(b?.icon, 40)) btn.icon = b.icon;
    if (optStr(b?.badge, 40)) btn.badge = b.badge;
    if (typeof b?.isPrimary === "boolean") btn.isPrimary = b.isPrimary;
    return btn;
  });
}

/**
 * Applies a customer's submitted changes onto the current menu,
 * keeping only the fields their preset allows.
 */
export function applyCustomerChanges(
  menu: Menu,
  data: Record<string, unknown>,
  preset: CustomerPreset
): Partial<Menu> {
  const currency = menu.themeSettings?.currency || "₱";

  if (preset === "quick_edit") {
    // Only price + availability on existing items, and opening hours.
    const submitted = new Map<string, any>();
    if (Array.isArray(data.categories)) {
      (data.categories as any[]).forEach((c) =>
        (Array.isArray(c?.items) ? c.items : []).forEach((i: any) => submitted.set(i?.id, i))
      );
    }
    const categories = menu.categories.map((c) => ({
      ...c,
      items: c.items.map((i) => {
        const s = submitted.get(i.id);
        if (!s) return i;
        return { ...i, price: num(s.price), isAvailable: s.isAvailable !== false };
      }),
    }));
    const contactInfo: MenuContactInfo = { ...(menu.contactInfo || {}) };
    const hours = (data.contactInfo as any)?.openingHours;
    if (typeof hours === "string") {
      if (hours.trim()) contactInfo.openingHours = hours.slice(0, 300);
      else delete contactInfo.openingHours;
    }
    return { categories, contactInfo };
  }

  // content preset
  const updates: Partial<Menu> = {};
  if (data.categories !== undefined) updates.categories = sanitizeCategories(data.categories, menu.categories, currency);
  if (data.contactInfo !== undefined) updates.contactInfo = sanitizeContact(data.contactInfo);
  if (data.actionButtons !== undefined) updates.actionButtons = sanitizeButtons(data.actionButtons);
  if (data.tagline !== undefined) updates.tagline = str(data.tagline, 200);
  return updates;
}

// ── Changelog diff ────────────────────────────────────────────────

export function diffMenu(before: Menu, after: Partial<Menu>, currency = "₱"): string[] {
  const changes: string[] = [];
  const peso = (n: number) => `${currency}${n}`;

  if (after.categories) {
    const beforeCats = new Map(before.categories.map((c) => [c.id, c]));
    const afterCats = new Map(after.categories.map((c) => [c.id, c]));

    after.categories.forEach((c) => {
      const prev = beforeCats.get(c.id);
      if (!prev) {
        changes.push(`Added category "${c.name}"`);
        c.items.forEach((i) => changes.push(`Added "${i.name}" (${peso(i.price)}) to ${c.name}`));
        return;
      }
      if (prev.name !== c.name) changes.push(`Renamed category "${prev.name}" → "${c.name}"`);
      const prevItems = new Map(prev.items.map((i) => [i.id, i]));
      const nextIds = new Set(c.items.map((i) => i.id));
      c.items.forEach((i) => {
        const p = prevItems.get(i.id);
        if (!p) {
          changes.push(`Added "${i.name}" (${peso(i.price)}) to ${c.name}`);
          return;
        }
        if (p.name !== i.name) changes.push(`Renamed "${p.name}" → "${i.name}"`);
        if (p.price !== i.price) changes.push(`"${i.name}" price ${peso(p.price)} → ${peso(i.price)}`);
        if (p.isAvailable !== i.isAvailable)
          changes.push(`"${i.name}" marked ${i.isAvailable ? "Available" : "Sold Out"}`);
        if ((p.description || "") !== (i.description || "")) changes.push(`"${i.name}" description updated`);
        if ((p.image || "") !== (i.image || "")) changes.push(`"${i.name}" photo updated`);
      });
      prev.items.forEach((p) => {
        if (!nextIds.has(p.id)) changes.push(`Removed "${p.name}" from ${c.name}`);
      });
    });
    before.categories.forEach((c) => {
      if (!afterCats.has(c.id)) changes.push(`Removed category "${c.name}"`);
    });
  }

  if (after.contactInfo) {
    const labels: Record<string, string> = {
      phone: "Phone",
      address: "Address",
      openingHours: "Opening hours",
      instagram: "Instagram",
      facebook: "Facebook",
      website: "Website",
    };
    Object.keys(labels).forEach((k) => {
      const a = (before.contactInfo as any)?.[k] || "";
      const b = (after.contactInfo as any)?.[k] || "";
      if (a !== b) changes.push(`${labels[k]}: "${a || "—"}" → "${b || "—"}"`);
    });
  }

  if (after.actionButtons && JSON.stringify(after.actionButtons) !== JSON.stringify(before.actionButtons || [])) {
    changes.push("Action buttons updated");
  }
  if (after.tagline !== undefined && after.tagline !== (before.tagline || "")) {
    changes.push(`Tagline → "${after.tagline}"`);
  }

  return changes.slice(0, 60);
}

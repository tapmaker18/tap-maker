import { auth } from "./firebase";
import type { CustomerPreset, Menu, MenuChangeLogEntry } from "./types";

async function call<T>(endpoint: string, payload: Record<string, unknown>): Promise<T> {
  const user = auth?.currentUser;
  if (!user) throw new Error("Please sign in again.");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await user.getIdToken()}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data?.error || "Request failed. Please try again.") as Error & { status?: number };
    err.status = response.status;
    throw err;
  }
  return data as T;
}

// ── Client / Super Admin: manage customers ──────────────────────

export interface CustomerMenuRef {
  menuId: string;
  preset: CustomerPreset;
  businessName: string;
  slug: string;
  status: string;
}

export interface CustomerSummary {
  uid: string;
  email: string;
  businessName: string;
  contactName: string;
  status: "approved" | "suspended" | "pending";
  parentClientId: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  menus: CustomerMenuRef[];
}

const CUSTOMERS = "/api/customers";

export const listCustomers = () =>
  call<{ customers: CustomerSummary[]; seats: { used: number; limit: number | null } }>(CUSTOMERS, {
    action: "list",
  });

export const createCustomer = (params: {
  email: string;
  businessName: string;
  contactName?: string;
  menuId: string;
  preset: CustomerPreset;
}) =>
  call<{ ok: true; customerUid: string; reused: boolean; setupLink: string | null }>(CUSTOMERS, {
    action: "create",
    ...params,
  });

export const assignMenuToCustomer = (customerUid: string, menuId: string, preset: CustomerPreset) =>
  call<{ ok: true }>(CUSTOMERS, { action: "assign", customerUid, menuId, preset });

export const unassignMenuFromCustomer = (customerUid: string, menuId: string) =>
  call<{ ok: true }>(CUSTOMERS, { action: "unassign", customerUid, menuId });

export const getCustomerSetupLink = (customerUid: string) =>
  call<{ setupLink: string }>(CUSTOMERS, { action: "setup-link", customerUid });

export const setCustomerStatus = (customerUid: string, status: "approved" | "suspended") =>
  call<{ ok: true }>(CUSTOMERS, { action: "set-status", customerUid, status });

export const deleteCustomer = (customerUid: string) =>
  call<{ ok: true }>(CUSTOMERS, { action: "delete", customerUid });

export const getMenuCustomerChangelog = (menuId: string) =>
  call<{ changelog: MenuChangeLogEntry[] }>(CUSTOMERS, { action: "changelog", menuId });

// ── Customer: own assigned menus ────────────────────────────────

export interface AssignedMenuSummary {
  id: string;
  businessName: string;
  tagline: string;
  slug: string;
  status: string;
  logoUrl: string;
  updatedAt: string;
  itemCount: number;
  soldOut: number;
  preset: CustomerPreset;
}

const CUSTOMER_MENUS = "/api/customer/menus";

export const listAssignedMenus = () => call<{ menus: AssignedMenuSummary[] }>(CUSTOMER_MENUS, { action: "list" });

export const getAssignedMenu = (menuId: string) =>
  call<{ menu: Menu; preset: CustomerPreset; changelog: MenuChangeLogEntry[] }>(CUSTOMER_MENUS, {
    action: "get",
    menuId,
  });

export const saveAssignedMenu = (
  menuId: string,
  expectedUpdatedAt: string,
  data: Partial<Pick<Menu, "categories" | "contactInfo" | "actionButtons" | "tagline">>
) =>
  call<{ menu: Menu; changes: string[] }>(CUSTOMER_MENUS, {
    action: "save",
    menuId,
    expectedUpdatedAt,
    data,
  });

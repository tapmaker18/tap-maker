import { auth, db, isFirebaseConfigured } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { MemberAccount, AccountStatus } from "./types";
import { SUPER_ADMIN_EMAIL } from "./admin";

const LOCAL_MEMBERS_KEY = "tapmaker_members_v1";

// ============================================================
// LocalStorage Fallback Helpers
// ============================================================
function getLocalMembers(): Record<string, MemberAccount> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_MEMBERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalMembers(members: Record<string, MemberAccount>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(members));
  } catch (err) {
    console.error("Error saving members to localStorage:", err);
  }
}

// ============================================================
// Default Admin Account Generator
// ============================================================
export function createDefaultAdminAccount(uid: string): MemberAccount {
  return {
    uid,
    email: SUPER_ADMIN_EMAIL,
    businessName: "Tap-Maker Studio (Super Admin)",
    contactName: "Adrian Calicdan",
    status: "approved",
    role: "super_admin",
    aiScansLimit: 999999,
    aiScansUsed: 0,
    cardTokensLimit: 999999,
    createdAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
  };
}

// ============================================================
// Get a Single Member Account
// ============================================================
export async function getMemberAccount(uid: string, email?: string): Promise<MemberAccount | null> {
  // 1. Try Firestore with timeout protection
  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await Promise.race([
        getDoc(userRef),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 2500)
        ),
      ]);

      if (snap && snap.exists()) {
        const data = snap.data() as MemberAccount;
        // Keep local cache fresh
        const local = getLocalMembers();
        local[uid] = data;
        saveLocalMembers(local);
        return data;
      }
    } catch (err) {
      console.warn("Firestore getMemberAccount note:", err);
    }
  }

  // 2. Fallback to localStorage
  const local = getLocalMembers();
  if (local[uid]) {
    return local[uid];
  }

  return null;
}

async function callAdminMembersApi<T>(payload: Record<string, unknown>): Promise<T> {
  const user = auth?.currentUser;
  if (!user) throw new Error("Please sign in as the Super Admin first.");

  const response = await fetch("/api/admin/members", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await user.getIdToken()}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Unable to manage this member account.");
  }
  return data as T;
}

// ============================================================
// Save or Update Member Account
// ============================================================
export async function saveMemberAccount(account: MemberAccount): Promise<void> {
  // Save local first
  const local = getLocalMembers();
  local[account.uid] = account;
  saveLocalMembers(local);

  // Sync to Firestore
  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, "users", account.uid);
      await Promise.race([
        setDoc(userRef, account, { merge: true }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 2500)
        ),
      ]);
    } catch (err) {
      console.warn("Firestore saveMemberAccount note:", err);
    }
  }
}

// ============================================================
// Get All Members (Super Admin View)
// ============================================================
export async function getAllMembers(): Promise<MemberAccount[]> {
  const map: Record<string, MemberAccount> = { ...getLocalMembers() };

  if (isFirebaseConfigured && db) {
    try {
      const snap = await Promise.race([
        getDocs(collection(db, "users")),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 3000)
        ),
      ]);

      snap.forEach((d) => {
        const item = d.data() as MemberAccount;
        map[item.uid] = item;
      });
      saveLocalMembers(map);
    } catch (err) {
      console.warn("Firestore getAllMembers note:", err);
    }
  }

  return Object.values(map).sort((a, b) => {
    // Pending first, then newest
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// ============================================================
// Update Member Status (Approve / Suspend / Pending)
// ============================================================
export async function updateMemberStatus(uid: string, status: AccountStatus): Promise<void> {
  await callAdminMembersApi({ action: "set-status", uid, status });
}

// ============================================================
// Add AI Scans Quota (Admin Top-Up)
// ============================================================
export async function addMemberAiScans(uid: string, count: number = 5): Promise<void> {
  await callAdminMembersApi({ action: "add-ai-scans", uid, count });
}

// ============================================================
// Manage Card Tokens Quota (Admin)
// ============================================================
export async function setMemberCardTokens(uid: string, tokens: number): Promise<void> {
  await callAdminMembersApi({ action: "set-card-tokens", uid, tokens });
}

export async function addMemberCardTokens(uid: string, count: number = 1): Promise<void> {
  await callAdminMembersApi({ action: "add-card-tokens", uid, count });
}

// ============================================================
// Delete Member Account
// ============================================================
export async function deleteMemberAccount(uid: string): Promise<void> {
  await callAdminMembersApi({ action: "delete", uid });
}

// ============================================================
// Create Member Account Directly by Super Admin
// ============================================================
export async function createMemberByAdmin(params: {
  email: string;
  pass: string;
  businessName: string;
  phone?: string;
  orderRef?: string;
  aiScansLimit?: number;
  cardTokensLimit?: number;
}): Promise<MemberAccount> {
  const result = await callAdminMembersApi<{ member: MemberAccount }>({
    action: "create",
    email: params.email,
    password: params.pass,
    businessName: params.businessName,
    phone: params.phone || "",
    orderRef: params.orderRef || "",
    aiScansLimit: params.aiScansLimit || 5,
    cardTokensLimit: params.cardTokensLimit || 1,
  });
  return result.member;
}


import { Menu, MenuCategory, MenuItem, MenuThemeSettings, MenuContactInfo } from "./types";
import { db, isFirebaseConfigured } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";

const MENU_STORAGE_KEY = "tapmaker_menus_v1";

// Reserved menu slugs
export const RESERVED_MENU_SLUGS = [
  "new",
  "editor",
  "admin",
  "api",
  "settings",
];

// ============================================================
// Default Theme for new menus
// ============================================================
export const DEFAULT_MENU_THEME: MenuThemeSettings = {
  accentColor: "#ea580c",
  bgColor: "#0f0f0f",
  textColor: "#f8fafc",
  cardStyle: "glass",
  fontFamily: "Plus Jakarta Sans",
  showPrices: true,
  currency: "₱",
  layout: "list",
};

// ============================================================
// Default empty menu template
// ============================================================
export function createEmptyMenu(userId: string): Menu {
  const id = `menu-${Date.now()}`;
  const now = new Date().toISOString();

  return {
    id,
    slug: "",
    businessName: "",
    tagline: "",
    logoUrl: "",
    coverImageUrl: "",
    categories: [
      {
        id: `cat-${Date.now()}`,
        name: "Main Menu",
        icon: "🍽️",
        items: [],
        isVisible: true,
        sortOrder: 0,
      },
    ],
    themeSettings: { ...DEFAULT_MENU_THEME },
    contactInfo: {},
    status: "draft",
    userId,
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================
// LocalStorage Fallback
// ============================================================
let inMemoryMenus: Menu[] = [];

function getLocalMenus(): Menu[] {
  if (typeof window === "undefined") return inMemoryMenus;
  try {
    const raw = localStorage.getItem(MENU_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalMenus(menus: Menu[]): void {
  inMemoryMenus = menus;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menus));
    } catch (err) {
      console.error("Error saving menus to localStorage:", err);
    }
  }
}

// ============================================================
// Get all menus for a user (or all if admin)
// ============================================================
export async function getMenus(userId?: string, isAdmin?: boolean): Promise<Menu[]> {
  if (isFirebaseConfigured && db) {
    try {
      let snap;
      if (isAdmin) {
        snap = await getDocs(collection(db, "menus"));
      } else if (userId) {
        const q = query(collection(db, "menus"), where("userId", "==", userId));
        snap = await getDocs(q);
      } else {
        snap = await getDocs(collection(db, "menus"));
      }
      const list: Menu[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Menu));
      return list;
    } catch (err) {
      console.warn("Firestore getMenus note, using local:", err);
    }
  }
  const local = getLocalMenus();
  if (userId && !isAdmin) {
    return local.filter((m) => m.userId === userId);
  }
  return local;
}

// ============================================================
// Get menu by ID
// ============================================================
export async function getMenuById(id: string): Promise<Menu | null> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "menus", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) return { ...snap.data(), id: snap.id } as Menu;
    } catch (err) {
      console.warn("Firestore getMenuById note:", err);
    }
  }
  const menus = getLocalMenus();
  return menus.find((m) => m.id === id) || null;
}

// ============================================================
// Get menu by slug (public page)
// ============================================================
export async function getMenuBySlug(slug: string): Promise<Menu | null> {
  const cleanSlug = slug.toLowerCase().trim();

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "menus"), where("slug", "==", cleanSlug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { ...d.data(), id: d.id } as Menu;
      }
    } catch (err) {
      console.warn("Firestore getMenuBySlug note:", err);
    }
  }
  const menus = getLocalMenus();
  return menus.find((m) => m.slug.toLowerCase() === cleanSlug) || null;
}

// ============================================================
// Check if menu slug is available
// ============================================================
export async function isMenuSlugAvailable(
  slug: string,
  excludeMenuId?: string
): Promise<boolean> {
  const cleanSlug = slug.toLowerCase().trim();
  if (RESERVED_MENU_SLUGS.includes(cleanSlug)) return false;

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "menus"), where("slug", "==", cleanSlug));
      const snap = await getDocs(q);
      const existing = snap.docs.find((d) => d.id !== excludeMenuId);
      return !existing;
    } catch (err) {
      console.warn("Firestore isMenuSlugAvailable note:", err);
    }
  }

  const menus = await getMenus();
  const existing = menus.find(
    (m) => m.slug.toLowerCase() === cleanSlug && m.id !== excludeMenuId
  );
  return !existing;
}

// ============================================================
// Save (create or update) menu
// ============================================================
export async function saveMenu(menu: Menu): Promise<Menu> {
  const now = new Date().toISOString();
  const updated: Menu = {
    ...menu,
    slug: menu.slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, ""),
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "menus", updated.id), updated);
    } catch (err) {
      console.error("Firestore saveMenu failed:", err);
    }
  }

  // Also keep local copy
  const menus = getLocalMenus();
  const index = menus.findIndex((m) => m.id === updated.id);
  if (index >= 0) {
    menus[index] = updated;
  } else {
    menus.unshift(updated);
  }
  saveLocalMenus(menus);

  return updated;
}

// ============================================================
// Delete menu
// ============================================================
export async function deleteMenu(id: string): Promise<boolean> {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "menus", id));
    } catch (err) {
      console.error("Firestore deleteMenu failed:", err);
    }
  }

  const menus = getLocalMenus().filter((m) => m.id !== id);
  saveLocalMenus(menus);
  return true;
}

// ============================================================
// Duplicate menu
// ============================================================
export async function duplicateMenu(id: string, userId?: string): Promise<Menu | null> {
  const original = await getMenuById(id);
  if (!original) return null;

  const newId = `menu-${Date.now()}`;
  let newSlug = `${original.slug}-copy`;
  let counter = 1;

  while (!(await isMenuSlugAvailable(newSlug))) {
    newSlug = `${original.slug}-copy-${counter++}`;
  }

  const duplicated: Menu = {
    ...original,
    id: newId,
    slug: newSlug,
    businessName: `${original.businessName} (Copy)`,
    status: "draft",
    userId: userId || original.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return await saveMenu(duplicated);
}

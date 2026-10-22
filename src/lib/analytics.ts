"use client";

import { db, isFirebaseConfigured } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  increment,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

// ============================================================
// Analytics Interfaces
// ============================================================

export interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  lastViewedAt: string | null;
  linkClicks: Record<string, number>; // { [linkId]: clickCount }
  linkTitles: Record<string, string>; // { [linkId]: title } for display
}

export interface AnalyticsEvent {
  type: "profile_view" | "link_click" | "contact_save" | "phone_call" | "email_click";
  linkId?: string;
  linkTitle?: string;
  timestamp: string;
  userAgent: string;
  referrer: string;
}

// ============================================================
// Default empty summary
// ============================================================
const EMPTY_SUMMARY: AnalyticsSummary = {
  totalViews: 0,
  totalClicks: 0,
  lastViewedAt: null,
  linkClicks: {},
  linkTitles: {},
};

// ============================================================
// LocalStorage fallback for dev mode
// ============================================================
const LOCAL_ANALYTICS_KEY = "tapmaker_analytics_v1";

function getLocalAnalytics(): Record<string, AnalyticsSummary> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_ANALYTICS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalAnalytics(data: Record<string, AnalyticsSummary>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_ANALYTICS_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Error saving analytics to localStorage:", err);
  }
}

// ============================================================
// Track: Profile View
// ============================================================
export async function trackProfileView(profileId: string): Promise<void> {
  const now = new Date().toISOString();

  if (isFirebaseConfigured && db) {
    try {
      const summaryRef = doc(db, "profiles", profileId, "analytics", "summary");
      const snap = await getDoc(summaryRef);

      if (snap.exists()) {
        await setDoc(
          summaryRef,
          {
            totalViews: increment(1),
            lastViewedAt: now,
          },
          { merge: true }
        );
      } else {
        await setDoc(summaryRef, {
          totalViews: 1,
          totalClicks: 0,
          lastViewedAt: now,
          linkClicks: {},
          linkTitles: {},
        });
      }

      // Write raw event log
      const eventsRef = collection(db, "profiles", profileId, "analytics", "summary", "events");
      await addDoc(eventsRef, {
        type: "profile_view",
        timestamp: now,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        referrer: typeof document !== "undefined" ? document.referrer : "",
      });
    } catch (err) {
      console.warn("Firestore trackProfileView note:", err);
    }
  }

  // Also update local storage fallback
  const local = getLocalAnalytics();
  if (!local[profileId]) {
    local[profileId] = { ...EMPTY_SUMMARY };
  }
  local[profileId].totalViews++;
  local[profileId].lastViewedAt = now;
  saveLocalAnalytics(local);
}

// ============================================================
// Track: Link Click
// ============================================================
export async function trackLinkClick(
  profileId: string,
  linkId: string,
  linkTitle: string,
  eventType: AnalyticsEvent["type"] = "link_click"
): Promise<void> {
  const now = new Date().toISOString();

  if (isFirebaseConfigured && db) {
    try {
      const summaryRef = doc(db, "profiles", profileId, "analytics", "summary");
      const snap = await getDoc(summaryRef);

      if (snap.exists()) {
        const existing = snap.data() as AnalyticsSummary;
        const linkClicks = { ...existing.linkClicks };
        const linkTitles = { ...existing.linkTitles };
        linkClicks[linkId] = (linkClicks[linkId] || 0) + 1;
        linkTitles[linkId] = linkTitle;

        await setDoc(
          summaryRef,
          {
            totalClicks: increment(1),
            linkClicks,
            linkTitles,
          },
          { merge: true }
        );
      } else {
        await setDoc(summaryRef, {
          totalViews: 0,
          totalClicks: 1,
          lastViewedAt: null,
          linkClicks: { [linkId]: 1 },
          linkTitles: { [linkId]: linkTitle },
        });
      }

      // Write raw event log
      const eventsRef = collection(db, "profiles", profileId, "analytics", "summary", "events");
      await addDoc(eventsRef, {
        type: eventType,
        linkId,
        linkTitle,
        timestamp: now,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        referrer: typeof document !== "undefined" ? document.referrer : "",
      });
    } catch (err) {
      console.warn("Firestore trackLinkClick note:", err);
    }
  }

  // Also update local storage fallback
  const local = getLocalAnalytics();
  if (!local[profileId]) {
    local[profileId] = { ...EMPTY_SUMMARY };
  }
  local[profileId].totalClicks++;
  local[profileId].linkClicks[linkId] = (local[profileId].linkClicks[linkId] || 0) + 1;
  local[profileId].linkTitles[linkId] = linkTitle;
  saveLocalAnalytics(local);
}

// ============================================================
// Fetch: Get Analytics Summary for a Profile
// ============================================================
export async function getAnalyticsSummary(profileId: string): Promise<AnalyticsSummary> {
  if (isFirebaseConfigured && db) {
    try {
      const summaryRef = doc(db, "profiles", profileId, "analytics", "summary");
      const snap = await getDoc(summaryRef);
      if (snap.exists()) {
        return snap.data() as AnalyticsSummary;
      }
    } catch (err) {
      console.warn("Firestore getAnalyticsSummary note:", err);
    }
  }

  // Fallback to localStorage
  const local = getLocalAnalytics();
  return local[profileId] || { ...EMPTY_SUMMARY };
}

// ============================================================
// Fetch: Get Analytics for ALL profiles (batch for dashboard)
// ============================================================
export async function getAllAnalyticsSummaries(
  profileIds: string[]
): Promise<Record<string, AnalyticsSummary>> {
  const results: Record<string, AnalyticsSummary> = {};

  if (isFirebaseConfigured && db) {
    const firestore = db;
    try {
      const promises = profileIds.map(async (pid) => {
        const summaryRef = doc(firestore, "profiles", pid, "analytics", "summary");
        const snap = await getDoc(summaryRef);
        if (snap.exists()) {
          results[pid] = snap.data() as AnalyticsSummary;
        }
      });
      await Promise.all(promises);
    } catch (err) {
      console.warn("Firestore getAllAnalyticsSummaries note:", err);
    }
  }

  // Merge with localStorage for any profiles missing from Firestore
  const local = getLocalAnalytics();
  for (const pid of profileIds) {
    if (!results[pid]) {
      results[pid] = local[pid] || { ...EMPTY_SUMMARY };
    }
  }

  return results;
}

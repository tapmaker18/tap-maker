import { auth } from "./firebase";

export type AssetType = "profile" | "menu";

async function callAssetsApi<T>(payload: Record<string, unknown>): Promise<T> {
  const user = auth?.currentUser;
  if (!user) throw new Error("Please sign in again.");

  const response = await fetch("/api/assets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await user.getIdToken()}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "Request failed. Please try again.");
  }
  return data as T;
}

/** Returns null when the server check is unavailable (not signed in / offline). */
export async function checkSlugRemote(
  type: AssetType,
  slug: string,
  excludeId?: string
): Promise<boolean | null> {
  if (!auth?.currentUser) return null;
  try {
    const res = await callAssetsApi<{ available: boolean }>({
      action: "check-slug",
      type,
      slug,
      excludeId,
    });
    return res.available;
  } catch (err) {
    console.warn("Remote slug check unavailable:", err);
    return null;
  }
}

export async function createAssetRemote<T>(type: AssetType, data: T): Promise<T> {
  const res = await callAssetsApi<{ asset: T }>({ action: "create", type, data });
  return res.asset;
}

export function canUseRemoteAssets(): boolean {
  return Boolean(auth?.currentUser);
}

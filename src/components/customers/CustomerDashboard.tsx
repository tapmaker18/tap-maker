"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, LogOut, ExternalLink, Pencil, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AssignedMenuSummary, listAssignedMenus } from "@/lib/customerApi";

export const CustomerDashboard: React.FC = () => {
  const router = useRouter();
  const { memberAccount, user, signOut } = useAuth();
  const [menus, setMenus] = useState<AssignedMenuSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAssignedMenus()
      .then((res) => setMenus(res.menus))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load your menus."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="h-16 px-4 sm:px-8 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Tap-Maker" className="w-9 h-9 rounded-2xl" />
          <div>
            <div className="font-extrabold text-sm text-white">{memberAccount?.businessName || "My Menu"}</div>
            <div className="text-[10px] text-slate-400">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-500/10 cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-xl font-extrabold text-white">Your Digital Menus</h1>
          <p className="text-xs text-slate-400 mt-1">
            I-update ang items, presyo, at oras anytime. Live agad ang changes pagka-save.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">Loading…</div>
        ) : menus.length === 0 && !error ? (
          <div className="p-10 rounded-2xl bg-slate-900 border border-dashed border-slate-700 text-center">
            <UtensilsCrossed className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-300">Wala pang menu na naka-assign sa'yo</p>
            <p className="text-xs text-slate-500 mt-1">Makipag-ugnayan sa provider mo para ma-assign ang menu.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {menus.map((m) => (
              <div key={m.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
                {m.logoUrl ? (
                  <img src={m.logoUrl} alt="" className="w-14 h-14 rounded-xl object-cover border border-slate-700" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <UtensilsCrossed className="w-6 h-6 text-emerald-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">{m.businessName || "Untitled"}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.status === "published" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {m.status === "published" ? "Live" : "Draft"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                    <span>{m.itemCount} items</span>
                    {m.soldOut > 0 && <span className="text-amber-300">{m.soldOut} sold out</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(m.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link
                    href={`/customer/menu/${m.id}`}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Link>
                  {m.status === "published" && (
                    <a
                      href={`/menu/${m.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  UserPlus,
  Copy,
  Check,
  Link2,
  Trash2,
  Ban,
  CheckCircle2,
  UtensilsCrossed,
  X,
  Users,
  RefreshCw,
  Info,
  History,
} from "lucide-react";
import type { CustomerPreset, Menu, MenuChangeLogEntry } from "@/lib/types";
import {
  CustomerSummary,
  assignMenuToCustomer,
  createCustomer,
  deleteCustomer,
  getCustomerSetupLink,
  getMenuCustomerChangelog,
  listCustomers,
  setCustomerStatus,
  unassignMenuFromCustomer,
} from "@/lib/customerApi";

const PRESET_LABEL: Record<CustomerPreset, string> = {
  content: "Content Editor",
  quick_edit: "Quick Edit",
};

const PRESET_HELP: Record<CustomerPreset, string> = {
  content: "Items, prices, categories, contact info at action buttons. Hindi kasama ang design/theme.",
  quick_edit: "Presyo, Available/Sold Out, at opening hours lang. Pang-staff o simpleng updates.",
};

interface CustomersPanelProps {
  menus: Menu[];
  isAdmin: boolean;
  initialHandoverMenuId?: string | null;
  onClearInitialHandover?: () => void;
}

export const CustomersPanel: React.FC<CustomersPanelProps> = ({
  menus,
  isAdmin,
  initialHandoverMenuId,
  onClearInitialHandover,
}) => {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [seats, setSeats] = useState<{ used: number; limit: number | null }>({ used: 0, limit: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    email: "",
    businessName: "",
    contactName: "",
    menuId: "",
    preset: "content" as CustomerPreset,
  });
  const [setupResult, setSetupResult] = useState<{ email: string; link: string | null; reused: boolean } | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [assignSel, setAssignSel] = useState<Record<string, { menuId: string; preset: CustomerPreset }>>({});
  const [historyModal, setHistoryModal] = useState<{
    menuName: string;
    entries: MenuChangeLogEntry[];
    loading: boolean;
  } | null>(null);

  const openMenuHistory = async (menuId: string, menuName: string) => {
    setHistoryModal({ menuName, entries: [], loading: true });
    try {
      const res = await getMenuCustomerChangelog(menuId);
      setHistoryModal({ menuName, entries: res.changelog || [], loading: false });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to load changelog.");
      setHistoryModal(null);
    }
  };

  const menuById = useMemo(() => new Map(menus.map((m) => [m.id, m])), [menus]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCustomers();
      setCustomers(res.customers);
      setSeats(res.seats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (initialHandoverMenuId) {
      const targetMenu = menus.find((m) => m.id === initialHandoverMenuId);
      setForm((prev) => ({
        ...prev,
        menuId: initialHandoverMenuId,
        businessName: prev.businessName || targetMenu?.businessName || "",
      }));
      setShowCreate(true);
      onClearInitialHandover?.();
    }
  }, [initialHandoverMenuId, menus, onClearInitialHandover]);

  const seatsFull = seats.limit !== null && seats.used >= seats.limit;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.menuId) {
      alert("Pumili muna ng menu na ibibigay sa customer.");
      return;
    }
    setBusy("create");
    try {
      const res = await createCustomer(form);
      setSetupResult({ email: form.email, link: res.setupLink, reused: res.reused });
      setForm({ email: "", businessName: "", contactName: "", menuId: "", preset: "content" });
      setShowCreate(false);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to create customer.");
    } finally {
      setBusy(null);
    }
  };

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await fn();
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  const handleGetLink = async (c: CustomerSummary) => {
    setBusy(`link-${c.uid}`);
    try {
      const res = await getCustomerSetupLink(c.uid);
      setSetupResult({ email: c.email, link: res.setupLink, reused: false });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to generate link.");
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Copy this link:", text);
    }
  };

  const shareMessage = (email: string, link: string) =>
    `Hi! Ito ang access mo para ma-edit ang digital menu ninyo.\n\n1) Buksan ang link na ito para i-set ang password mo:\n${link}\n\n2) Pagkatapos, mag-login dito gamit ang ${email}:\n${typeof window !== "undefined" ? window.location.origin : ""}/login`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            {isAdmin ? "All Customer Accounts" : "My Customers"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Bigyan ng sariling login ang nabentahan mo ng menu para sila na mismo ang mag-update ng items, presyo
            at oras. Hindi nila magagalaw ang design.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {seats.limit !== null && (
            <span
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border ${
                seatsFull
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
              }`}
              title="1 card token = 1 customer seat"
            >
              Seats: {seats.used} / {seats.limit}
            </span>
          )}
          <button
            onClick={load}
            className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            disabled={menus.length === 0}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {menus.length === 0 && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500" />
          Gumawa muna ng Digital Menu bago mag-add ng customer.
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">{error}</div>
      )}

      {/* Setup link result */}
      {setupResult && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-emerald-300">
                {setupResult.reused ? "Menu assigned sa existing customer" : "Customer access ready!"}
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                {setupResult.reused
                  ? `Makikita na ni ${setupResult.email} ang menu sa susunod na login niya.`
                  : `I-send kay ${setupResult.email} ang setup link (Messenger, Viber, SMS o email). Siya ang magse-set ng sarili niyang password.`}
              </p>
            </div>
            <button onClick={() => setSetupResult(null)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          {setupResult.link && (
            <>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={setupResult.link}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-[11px] text-slate-300 font-mono"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={() => copyLink(setupResult.link!)}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy link"}
                </button>
              </div>
              <button
                onClick={() => copyLink(shareMessage(setupResult.email, setupResult.link!))}
                className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 underline cursor-pointer"
              >
                Copy ready-to-send message (Taglish)
              </button>
              <p className="text-[10px] text-slate-500">
                Ang link ay one-time use at nag-e-expire. Pwede kang gumawa ulit gamit ang “Setup link” button.
              </p>
            </>
          )}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-4 animate-fade-slide-up"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-cyan-400" /> Handover Menu to Customer
            </h3>
            <button type="button" onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {seatsFull && (
            <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5">
              Puno na ang customer seats mo. Pwede ka pa ring mag-assign ng menu sa <b>existing</b> customer email.
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-slate-300 space-y-1.5">
              <span className="font-semibold">Customer Email *</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="owner@restaurant.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </label>
            <label className="text-xs text-slate-300 space-y-1.5">
              <span className="font-semibold">Business Name *</span>
              <input
                required
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="Juan's Café"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </label>
            <label className="text-xs text-slate-300 space-y-1.5">
              <span className="font-semibold">Contact Person</span>
              <input
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                placeholder="Juan Dela Cruz"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </label>
            <label className="text-xs text-slate-300 space-y-1.5">
              <span className="font-semibold">Menu to Hand Over *</span>
              <select
                required
                value={form.menuId}
                onChange={(e) => setForm({ ...form, menuId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select a menu…</option>
                {menus.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.businessName || "Untitled"} (/menu/{m.slug})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {(Object.keys(PRESET_LABEL) as CustomerPreset[]).map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setForm({ ...form, preset: p })}
                className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                  form.preset === p
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-slate-700 bg-slate-950 hover:border-slate-500"
                }`}
              >
                <div className="text-xs font-bold text-white">{PRESET_LABEL[p]}</div>
                <div className="text-[11px] text-slate-400 mt-1">{PRESET_HELP[p]}</div>
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy === "create"}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
            >
              {busy === "create" ? "Creating…" : "Create & Get Setup Link"}
            </button>
          </div>
        </form>
      )}

      {/* Customer list */}
      {loading && customers.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading customers…</div>
      ) : customers.length === 0 ? (
        <div className="p-10 rounded-2xl bg-slate-900 border border-dashed border-slate-700 text-center">
          <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-300">Wala pang customer accounts</p>
          <p className="text-xs text-slate-500 mt-1">I-click ang “Add Customer” para i-handover ang isang menu.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {customers.map((c) => {
            const assignedIds = new Set(c.menus.map((m) => m.menuId));
            const assignable = menus.filter(
              (m) => !assignedIds.has(m.id) && (isAdmin ? m.userId === c.parentClientId : true)
            );
            const sel = assignSel[c.uid] || { menuId: "", preset: "content" as CustomerPreset };
            return (
              <div key={c.uid} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{c.businessName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          c.status === "approved"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                        }`}
                      >
                        {c.status === "approved" ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {c.email}
                      {c.contactName ? ` · ${c.contactName}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleGetLink(c)}
                      disabled={busy === `link-${c.uid}`}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px] font-bold text-slate-300 hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                      title="Generate a new password setup / reset link"
                    >
                      <Link2 className="w-3.5 h-3.5" /> Setup link
                    </button>
                    <button
                      onClick={() =>
                        run(`status-${c.uid}`, () =>
                          setCustomerStatus(c.uid, c.status === "approved" ? "suspended" : "approved")
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px] font-bold text-slate-300 hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      {c.status === "approved" ? (
                        <>
                          <Ban className="w-3.5 h-3.5" /> Disable
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Enable
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete customer ${c.email}? Mawawala ang access nila sa lahat ng menus.`)) {
                          run(`del-${c.uid}`, () => deleteCustomer(c.uid));
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      title="Delete customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Assigned menus */}
                <div className="flex flex-wrap gap-2">
                  {c.menus.length === 0 && <span className="text-[11px] text-slate-500">No menus assigned.</span>}
                  {c.menus.map((m) => (
                    <span
                      key={m.menuId}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-slate-300"
                    >
                      <UtensilsCrossed className="w-3 h-3 text-emerald-400" />
                      {m.businessName || menuById.get(m.menuId)?.businessName || m.slug}
                      <span className="text-[10px] text-cyan-300">· {PRESET_LABEL[m.preset]}</span>
                      <button
                        onClick={() =>
                          openMenuHistory(
                            m.menuId,
                            m.businessName || menuById.get(m.menuId)?.businessName || m.slug
                          )
                        }
                        className="p-0.5 rounded text-slate-400 hover:text-cyan-300 cursor-pointer"
                        title="View customer edit history"
                      >
                        <History className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove access to "${m.businessName}"?`)) {
                            run(`un-${c.uid}-${m.menuId}`, () => unassignMenuFromCustomer(c.uid, m.menuId));
                          }
                        }}
                        className="p-0.5 rounded text-slate-500 hover:text-rose-400 cursor-pointer"
                        title="Remove access"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {assignable.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-slate-800">
                    <select
                      value={sel.menuId}
                      onChange={(e) => setAssignSel({ ...assignSel, [c.uid]: { ...sel, menuId: e.target.value } })}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white"
                    >
                      <option value="">+ Assign another menu…</option>
                      {assignable.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.businessName || "Untitled"} (/menu/{m.slug})
                        </option>
                      ))}
                    </select>
                    <select
                      value={sel.preset}
                      onChange={(e) =>
                        setAssignSel({
                          ...assignSel,
                          [c.uid]: { ...sel, preset: e.target.value as CustomerPreset },
                        })
                      }
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white"
                    >
                      <option value="content">Content Editor</option>
                      <option value="quick_edit">Quick Edit</option>
                    </select>
                    <button
                      disabled={!sel.menuId || busy === `as-${c.uid}`}
                      onClick={() =>
                        run(`as-${c.uid}`, async () => {
                          await assignMenuToCustomer(c.uid, sel.menuId, sel.preset);
                          setAssignSel({ ...assignSel, [c.uid]: { menuId: "", preset: "content" } });
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[11px] font-bold text-white cursor-pointer"
                    >
                      Assign
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Changelog Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                Edit History — {historyModal.menuName}
              </h3>
              <button
                onClick={() => setHistoryModal(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {historyModal.loading ? (
                <p className="text-xs text-slate-500 text-center py-6">Loading edit history…</p>
              ) : historyModal.entries.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  Wala pang customer edits sa menu na ito.
                </p>
              ) : (
                historyModal.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-bold text-cyan-300">
                        {entry.actorEmail || "Customer"}
                      </span>
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    <ul className="text-xs text-slate-300 list-disc list-inside space-y-0.5">
                      {(entry.changes || []).map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

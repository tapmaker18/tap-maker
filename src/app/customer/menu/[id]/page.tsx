"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Check,
  UtensilsCrossed,
  Plus,
  Trash2,
  Clock,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  History,
  Sparkles,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lock,
  Zap,
  Sliders,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getAssignedMenu, saveAssignedMenu } from "@/lib/customerApi";
import { uploadImageFile } from "@/lib/imageUpload";
import { MenuPhonePreviewFrame } from "@/components/menu/MenuPhonePreviewFrame";
import type {
  CustomerPreset,
  Menu,
  MenuCategory,
  MenuItem,
  MenuActionButton,
  MenuChangeLogEntry,
} from "@/lib/types";

type EditorMode = "quick" | "full" | "contact" | "history";

export default function CustomerMenuEditorPage() {
  const params = useParams();
  const router = useRouter();
  const menuId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [menu, setMenu] = useState<Menu | null>(null);
  const [preset, setPreset] = useState<CustomerPreset>("content");
  const [changelog, setChangelog] = useState<MenuChangeLogEntry[]>([]);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastChanges, setLastChanges] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<EditorMode>("quick");
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const itemFileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingUploadTargetRef = useRef<{ categoryId: string; itemId: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=/customer/menu/${menuId}`);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getAssignedMenu(menuId);
        setMenu(res.menu);
        setPreset(res.preset);
        setChangelog(res.changelog || []);
        setExpectedUpdatedAt(res.menu.updatedAt);
        if (res.menu.categories.length > 0) {
          const initExpanded: Record<string, boolean> = {};
          res.menu.categories.forEach((c) => {
            initExpanded[c.id] = true;
          });
          setExpandedCategories(initExpanded);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load this menu.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [menuId, user, authLoading, router]);

  const handleSave = async () => {
    if (!menu) return;
    setSaving(true);
    setLastChanges([]);
    try {
      const res = await saveAssignedMenu(menu.id, expectedUpdatedAt, {
        categories: menu.categories,
        contactInfo: menu.contactInfo,
        actionButtons: menu.actionButtons,
        tagline: menu.tagline,
      });
      setMenu(res.menu);
      setExpectedUpdatedAt(res.menu.updatedAt);
      setLastChanges(res.changes || []);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      // Refresh changelog
      const refreshed = await getAssignedMenu(menu.id).catch(() => null);
      if (refreshed) setChangelog(refreshed.changelog || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // ── Quick-Edit helpers ────────────────────────────────────────
  const toggleItemAvailability = (categoryId: string, itemId: string) => {
    if (!menu) return;
    setMenu({
      ...menu,
      categories: menu.categories.map((cat) =>
        cat.id !== categoryId
          ? cat
          : {
              ...cat,
              items: cat.items.map((item) =>
                item.id !== itemId ? item : { ...item, isAvailable: !item.isAvailable }
              ),
            }
      ),
    });
  };

  const updateItemField = (
    categoryId: string,
    itemId: string,
    updates: Partial<MenuItem>
  ) => {
    if (!menu) return;
    setMenu({
      ...menu,
      categories: menu.categories.map((cat) =>
        cat.id !== categoryId
          ? cat
          : {
              ...cat,
              items: cat.items.map((item) =>
                item.id !== itemId ? item : { ...item, ...updates }
              ),
            }
      ),
    });
  };

  // ── Full Content helpers (content preset only) ────────────────
  const handleAddCategory = () => {
    if (!menu || preset === "quick_edit" || !newCategoryName.trim()) return;
    const newCat: MenuCategory = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      icon: "🍽️",
      items: [],
      isVisible: true,
      sortOrder: menu.categories.length,
    };
    setMenu({
      ...menu,
      categories: [...menu.categories, newCat],
    });
    setExpandedCategories((prev) => ({ ...prev, [newCat.id]: true }));
    setNewCategoryName("");
  };

  const handleDeleteCategory = (categoryId: string, name: string) => {
    if (!menu || preset === "quick_edit") return;
    if (!confirm(`Delete category "${name}" and all its items?`)) return;
    setMenu({
      ...menu,
      categories: menu.categories.filter((c) => c.id !== categoryId),
    });
  };

  const handleAddItem = (categoryId: string) => {
    if (!menu || preset === "quick_edit") return;
    const currency = menu.themeSettings?.currency || "₱";
    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      name: "New Dish",
      description: "",
      price: 100,
      currency,
      isAvailable: true,
      isFeatured: false,
      sortOrder: 0,
    };
    setMenu({
      ...menu,
      categories: menu.categories.map((c) =>
        c.id !== categoryId ? c : { ...c, items: [...c.items, newItem] }
      ),
    });
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    if (!menu || preset === "quick_edit") return;
    setMenu({
      ...menu,
      categories: menu.categories.map((c) =>
        c.id !== categoryId ? c : { ...c, items: c.items.filter((i) => i.id !== itemId) }
      ),
    });
  };

  const triggerItemPhotoUpload = (categoryId: string, itemId: string) => {
    if (preset === "quick_edit") return;
    pendingUploadTargetRef.current = { categoryId, itemId };
    itemFileInputRef.current?.click();
  };

  const handleItemPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = pendingUploadTargetRef.current;
    if (!file || !target || !menu) return;
    try {
      setUploadingItemId(target.itemId);
      const dataUrl = await uploadImageFile(file, {
        folder: "menu-items",
        maxWidth: 600,
        maxHeight: 600,
      });
      updateItemField(target.categoryId, target.itemId, { image: dataUrl });
    } catch (err: any) {
      alert(err?.message || "Failed to upload photo.");
    } finally {
      setUploadingItemId(null);
      pendingUploadTargetRef.current = null;
      if (itemFileInputRef.current) itemFileInputRef.current.value = "";
    }
  };

  const handleAddActionButton = () => {
    if (!menu || preset === "quick_edit") return;
    const next: MenuActionButton = {
      id: `btn-${Date.now()}`,
      title: "Order Online",
      url: "https://",
      icon: "shopping-bag",
      isPrimary: false,
    };
    setMenu({
      ...menu,
      actionButtons: [...(menu.actionButtons || []), next],
    });
  };

  const handleUpdateActionButton = (id: string, updates: Partial<MenuActionButton>) => {
    if (!menu || preset === "quick_edit") return;
    setMenu({
      ...menu,
      actionButtons: (menu.actionButtons || []).map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    });
  };

  const handleRemoveActionButton = (id: string) => {
    if (!menu || preset === "quick_edit") return;
    setMenu({
      ...menu,
      actionButtons: (menu.actionButtons || []).filter((b) => b.id !== id),
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-2.5 text-xs text-slate-400">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Loading your menu editor…
        </div>
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm font-bold text-white">{error || "Menu not found"}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currency = menu.themeSettings?.currency || "₱";
  const totalItems = menu.categories.reduce((n, c) => n + c.items.length, 0);
  const soldOutCount = menu.categories.reduce(
    (n, c) => n + c.items.filter((i) => !i.isAvailable).length,
    0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <input
        ref={itemFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleItemPhotoSelected}
      />

      {/* Top Bar */}
      <header className="h-16 px-4 sm:px-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold text-white truncate">
                {menu.businessName || "Digital Menu"}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                {preset === "quick_edit" ? "Quick Edit" : "Content Editor"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {totalItems} items · {soldOutCount} sold out · Brand theme is protected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="lg:hidden px-3 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300"
          >
            {showMobilePreview ? "Editor" : "Preview"}
          </button>

          {menu.status === "published" && (
            <a
              href={`/menu/${menu.slug}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Live Menu
            </a>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" /> Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
              </>
            )}
          </button>
        </div>
      </header>

      {/* Save feedback toast */}
      {saveSuccess && lastChanges.length > 0 && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-300 flex items-center justify-between">
          <span>
            ✓ Saved {lastChanges.length} change{lastChanges.length > 1 ? "s" : ""}:{" "}
            {lastChanges.slice(0, 2).join(" · ")}
            {lastChanges.length > 2 ? ` (+${lastChanges.length - 2} more)` : ""}
          </span>
        </div>
      )}

      {/* Main Two-Panel Layout */}
      <div className="flex-1 grid lg:grid-cols-12 max-w-7xl w-full mx-auto">
        {/* Left Editor Panel */}
        <div
          className={`lg:col-span-7 p-4 sm:p-6 space-y-5 ${
            showMobilePreview ? "hidden lg:block" : "block"
          }`}
        >
          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab("quick")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                activeTab === "quick"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Quick Availability & Prices
            </button>

            {preset === "content" && (
              <button
                onClick={() => setActiveTab("full")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                  activeTab === "full"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" /> Edit Items & Categories
              </button>
            )}

            <button
              onClick={() => setActiveTab("contact")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                activeTab === "contact"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Hours & Info
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                activeTab === "history"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <History className="w-3.5 h-3.5" /> History ({changelog.length})
            </button>
          </div>

          {/* 1. QUICK EDIT MODE (Mobile-First 1-tap Sold Out + Price) */}
          {activeTab === "quick" && (
            <div className="space-y-4">
              {/* Quick Hours Bar */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> Today&apos;s Hours / Status
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setMenu({
                        ...menu,
                        contactInfo: {
                          ...menu.contactInfo,
                          openingHours: "Closed Today",
                        },
                      })
                    }
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 cursor-pointer"
                  >
                    Mark &ldquo;Closed Today&rdquo;
                  </button>
                </div>
                <input
                  value={menu.contactInfo?.openingHours || ""}
                  onChange={(e) =>
                    setMenu({
                      ...menu,
                      contactInfo: { ...menu.contactInfo, openingHours: e.target.value },
                    })
                  }
                  placeholder="e.g. Mon-Sun: 8:00 AM - 10:00 PM"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {menu.categories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden"
                >
                  <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white">
                      {cat.icon} {cat.name}
                    </span>
                    <span className="text-[11px] text-slate-400">{cat.items.length} items</span>
                  </div>
                  <div className="divide-y divide-slate-800/70">
                    {cat.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-xs font-bold truncate ${
                              item.isAvailable ? "text-white" : "text-slate-500 line-through"
                            }`}
                          >
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="text-[11px] text-slate-500 truncate">
                              {item.description}
                            </div>
                          )}
                        </div>

                        {/* Inline Price Input */}
                        <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5">
                          <span className="text-xs text-slate-400 mr-1">{currency}</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) =>
                              updateItemField(cat.id, item.id, {
                                price: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-16 bg-transparent text-xs font-bold text-white focus:outline-none"
                          />
                        </div>

                        {/* 1-Tap Available / Sold Out Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleItemAvailability(cat.id, item.id)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                            item.isAvailable
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                              : "bg-rose-500/15 border-rose-500/40 text-rose-300"
                          }`}
                        >
                          {item.isAvailable ? "Available" : "Sold Out"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. FULL CONTENT MODE (Categories + Items CRUD) */}
          {activeTab === "full" && preset === "content" && (
            <div className="space-y-4">
              {/* Add Category */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex gap-2">
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name (e.g. Signature Drinks, Desserts)…"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Category
                </button>
              </div>

              {menu.categories.map((cat) => {
                const isOpen = expandedCategories[cat.id] !== false;
                return (
                  <div
                    key={cat.id}
                    className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden"
                  >
                    <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          value={cat.icon || ""}
                          onChange={(e) =>
                            setMenu({
                              ...menu,
                              categories: menu.categories.map((c) =>
                                c.id === cat.id ? { ...c, icon: e.target.value } : c
                              ),
                            })
                          }
                          className="w-10 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-xs"
                          placeholder="🍽️"
                        />
                        <input
                          value={cat.name}
                          onChange={(e) =>
                            setMenu({
                              ...menu,
                              categories: menu.categories.map((c) =>
                                c.id === cat.id ? { ...c, name: e.target.value } : c
                              ),
                            })
                          }
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAddItem(cat.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Item
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="p-1.5 text-rose-400/70 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCategories({ ...expandedCategories, [cat.id]: !isOpen })
                          }
                          className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="p-3.5 space-y-3">
                        {cat.items.length === 0 ? (
                          <p className="text-center text-xs text-slate-500 py-3">
                            No items in this category yet.
                          </p>
                        ) : (
                          cat.items.map((item) => (
                            <div
                              key={item.id}
                              className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                            >
                              <div className="flex items-start gap-3">
                                {/* Item Photo */}
                                <button
                                  type="button"
                                  onClick={() => triggerItemPhotoUpload(cat.id, item.id)}
                                  className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 hover:border-emerald-500 cursor-pointer"
                                  title="Upload item photo"
                                >
                                  {uploadingItemId === item.id ? (
                                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                  ) : item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <ImageIcon className="w-5 h-5 text-slate-600" />
                                  )}
                                </button>

                                <div className="flex-1 space-y-2">
                                  <div className="flex gap-2">
                                    <input
                                      value={item.name}
                                      onChange={(e) =>
                                        updateItemField(cat.id, item.id, { name: e.target.value })
                                      }
                                      placeholder="Item name"
                                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white"
                                    />
                                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2">
                                      <span className="text-xs text-slate-400 mr-1">{currency}</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.price}
                                        onChange={(e) =>
                                          updateItemField(cat.id, item.id, {
                                            price: parseFloat(e.target.value) || 0,
                                          })
                                        }
                                        className="w-16 bg-transparent text-xs font-bold text-white focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  <textarea
                                    rows={2}
                                    value={item.description || ""}
                                    onChange={(e) =>
                                      updateItemField(cat.id, item.id, {
                                        description: e.target.value,
                                      })
                                    }
                                    placeholder="Short appetizing description…"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleItemAvailability(cat.id, item.id)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                                      item.isAvailable
                                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                        : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                                    }`}
                                  >
                                    {item.isAvailable ? "Available" : "Sold Out"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateItemField(cat.id, item.id, {
                                        isFeatured: !item.isFeatured,
                                      })
                                    }
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 cursor-pointer ${
                                      item.isFeatured
                                        ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                                        : "border-slate-800 text-slate-500"
                                    }`}
                                  >
                                    <Sparkles className="w-3 h-3" /> Bestseller
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(cat.id, item.id)}
                                  className="text-xs text-rose-400/70 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Remove
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. HOURS & CONTACT INFO + ACTION BUTTONS */}
          {activeTab === "contact" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Store Hours & Contact
                </h3>

                {preset === "content" && (
                  <label className="block text-xs text-slate-300 space-y-1">
                    <span className="font-semibold">Tagline / Announcement</span>
                    <input
                      value={menu.tagline || ""}
                      onChange={(e) => setMenu({ ...menu, tagline: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </label>
                )}

                <label className="block text-xs text-slate-300 space-y-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> Opening Hours
                  </span>
                  <input
                    value={menu.contactInfo?.openingHours || ""}
                    onChange={(e) =>
                      setMenu({
                        ...menu,
                        contactInfo: { ...menu.contactInfo, openingHours: e.target.value },
                      })
                    }
                    placeholder="Mon-Sun: 8:00 AM - 10:00 PM"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </label>

                {preset === "content" && (
                  <>
                    <label className="block text-xs text-slate-300 space-y-1">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone / Hotline
                      </span>
                      <input
                        value={menu.contactInfo?.phone || ""}
                        onChange={(e) =>
                          setMenu({
                            ...menu,
                            contactInfo: { ...menu.contactInfo, phone: e.target.value },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </label>

                    <label className="block text-xs text-slate-300 space-y-1">
                      <span className="font-semibold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Store Address
                      </span>
                      <input
                        value={menu.contactInfo?.address || ""}
                        onChange={(e) =>
                          setMenu({
                            ...menu,
                            contactInfo: { ...menu.contactInfo, address: e.target.value },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </label>

                    <label className="block text-xs text-slate-300 space-y-1">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-emerald-400" /> Website / Social Link
                      </span>
                      <input
                        value={menu.contactInfo?.website || ""}
                        onChange={(e) =>
                          setMenu({
                            ...menu,
                            contactInfo: { ...menu.contactInfo, website: e.target.value },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </label>
                  </>
                )}
              </div>

              {preset === "content" && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Action Buttons (Order / Reserve / WiFi)
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddActionButton}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Button
                    </button>
                  </div>

                  {(menu.actionButtons || []).length === 0 ? (
                    <p className="text-xs text-slate-500">No action buttons configured.</p>
                  ) : (
                    (menu.actionButtons || []).map((btn) => (
                      <div
                        key={btn.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row gap-2"
                      >
                        <input
                          value={btn.title}
                          onChange={(e) =>
                            handleUpdateActionButton(btn.id, { title: e.target.value })
                          }
                          placeholder="Button Title"
                          className="sm:w-1/3 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                        />
                        <input
                          value={btn.url}
                          onChange={(e) =>
                            handleUpdateActionButton(btn.id, { url: e.target.value })
                          }
                          placeholder="https://..."
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveActionButton(btn.id)}
                          className="p-1.5 text-rose-400/70 hover:text-rose-400 self-end sm:self-center cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. EDIT HISTORY / CHANGELOG */}
          {activeTab === "history" && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-emerald-400" /> Recent Menu Changes
              </h3>
              {changelog.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  No recorded edits yet. Your changes will appear here after you save.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {changelog.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-bold text-slate-300">
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
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Live Phone Preview Panel */}
        <div
          className={`lg:col-span-5 p-4 sm:p-6 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] flex items-center justify-center ${
            showMobilePreview ? "block" : "hidden lg:flex"
          }`}
        >
          <MenuPhonePreviewFrame menu={menu} />
        </div>
      </div>
    </div>
  );
}

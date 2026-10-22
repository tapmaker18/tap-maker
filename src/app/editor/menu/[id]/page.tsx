"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Menu, MenuCategory, MenuItem } from "@/lib/types";
import { getMenuById, saveMenu, isMenuSlugAvailable } from "@/lib/menuStorage";
import {
  scanMenuWithGemini,
  getGeminiApiKey,
  saveGeminiApiKey,
} from "@/lib/menuAI";
import {
  UtensilsCrossed,
  Sparkles,
  ArrowLeft,
  Eye,
  Save,
  Plus,
  Trash2,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Clock,
  MapPin,
  Phone,
  Globe,
  Instagram,
  Facebook,
  ExternalLink,
  Upload,
  AlertCircle,
  Copy,
  Layers,
  Settings,
  Store,
  Palette,
  Loader2,
  Key,
} from "lucide-react";
import { MenuPhonePreviewFrame } from "@/components/menu/MenuPhonePreviewFrame";
import Link from "next/link";

export default function MenuEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const menuId = params.id as string;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"items" | "business" | "appearance">("items");
  const [mobileMode, setMobileMode] = useState<"edit" | "preview">("edit");

  // AI Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiImageFile, setAiImageFile] = useState<File | null>(null);
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
  const [aiCustomKey, setAiCustomKey] = useState("");
  const [aiScanning, setAiScanning] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiAppendMode, setAiAppendMode] = useState<"replace" | "append">("append");

  // Active Category & Item editing
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemData, setEditingItemData] = useState<Partial<MenuItem>>({});
  const [addingToCategoryId, setAddingToCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);

  // Slug check error
  const [slugError, setSlugError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=/editor/menu/${menuId}`);
      return;
    }

    async function load() {
      try {
        const data = await getMenuById(menuId);
        if (!data) {
          router.push("/dashboard");
          return;
        }

        // Verify ownership (unless admin)
        const isAdmin = user?.email === "adriancalicdan2@gmail.com";
        if (data.userId && user?.uid && data.userId !== user.uid && !isAdmin) {
          alert("You do not have permission to edit this menu.");
          router.push("/dashboard");
          return;
        }

        setMenu(data);
        // Expand first category by default
        if (data.categories.length > 0) {
          setExpandedCategories({ [data.categories[0].id]: true });
        }
      } catch (err) {
        console.error("Error loading menu:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [menuId, user, authLoading, router]);

  // Load existing Gemini API key if saved
  useEffect(() => {
    const key = getGeminiApiKey();
    if (key) setAiCustomKey(key);
  }, []);

  const handleSave = async (updatedData?: Partial<Menu>) => {
    if (!menu) return;
    setSaving(true);
    try {
      const payload: Menu = {
        ...menu,
        ...(updatedData || {}),
        updatedAt: new Date().toISOString(),
      };
      await saveMenu(payload);
      setMenu(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Error saving menu:", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!menu) return;
    const newStatus = menu.status === "published" ? "draft" : "published";
    await handleSave({ status: newStatus });
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Add Category
  const handleAddCategory = () => {
    if (!menu || !newCategoryName.trim()) return;
    const newCat: MenuCategory = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newCategoryName.trim(),
      items: [],
      isVisible: true,
      sortOrder: menu.categories.length,
    };
    const updated = {
      ...menu,
      categories: [...menu.categories, newCat],
    };
    setMenu(updated);
    setExpandedCategories((prev) => ({ ...prev, [newCat.id]: true }));
    setNewCategoryName("");
    setShowAddCategoryInput(false);
    handleSave(updated);
  };

  // Delete Category
  const handleDeleteCategory = (categoryId: string) => {
    if (!menu) return;
    if (!confirm("Are you sure you want to delete this category and all its items?")) return;
    const updated = {
      ...menu,
      categories: menu.categories.filter((c) => c.id !== categoryId),
    };
    setMenu(updated);
    handleSave(updated);
  };

  // Start adding item to category
  const startAddItem = (categoryId: string) => {
    setAddingToCategoryId(categoryId);
    setEditingItemId(null);
    setEditingItemData({
      name: "",
      description: "",
      price: 0,
      currency: menu?.themeSettings?.currency || "PHP",
      image: "",
      isAvailable: true,
      isFeatured: false,
      tags: [],
    });
  };

  // Start editing existing item
  const startEditItem = (item: MenuItem) => {
    setAddingToCategoryId(null);
    setEditingItemId(item.id);
    setEditingItemData({ ...item });
  };

  // Save Item (New or Edit)
  const handleSaveItem = (categoryId: string) => {
    if (!menu || !editingItemData.name?.trim()) return;

    let updatedCategories: MenuCategory[];

    if (addingToCategoryId) {
      // Adding new
      const newItem: MenuItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: editingItemData.name.trim(),
        description: editingItemData.description || "",
        price: Number(editingItemData.price) || 0,
        currency: menu.themeSettings?.currency || "PHP",
        image: editingItemData.image || "",
        isAvailable: editingItemData.isAvailable ?? true,
        isFeatured: editingItemData.isFeatured ?? false,
        tags: editingItemData.tags || [],
        sortOrder: 0,
      };

      updatedCategories = menu.categories.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            items: [...cat.items, { ...newItem, sortOrder: cat.items.length }],
          };
        }
        return cat;
      });
    } else if (editingItemId) {
      // Editing existing
      updatedCategories = menu.categories.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            items: cat.items.map((it) =>
              it.id === editingItemId ? ({ ...it, ...editingItemData } as MenuItem) : it
            ),
          };
        }
        return cat;
      });
    } else {
      return;
    }

    const updated = { ...menu, categories: updatedCategories };
    setMenu(updated);
    setAddingToCategoryId(null);
    setEditingItemId(null);
    setEditingItemData({});
    handleSave(updated);
  };

  // Delete item
  const handleDeleteItem = (categoryId: string, itemId: string) => {
    if (!menu) return;
    const updatedCategories = menu.categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.filter((it) => it.id !== itemId),
        };
      }
      return cat;
    });
    const updated = { ...menu, categories: updatedCategories };
    setMenu(updated);
    handleSave(updated);
  };

  // Toggle Item Availability
  const handleToggleItemAvailability = (categoryId: string, itemId: string) => {
    if (!menu) return;
    const updatedCategories = menu.categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map((it) =>
            it.id === itemId ? { ...it, isAvailable: !it.isAvailable } : it
          ),
        };
      }
      return cat;
    });
    const updated = { ...menu, categories: updatedCategories };
    setMenu(updated);
    handleSave(updated);
  };

  // AI Scanner Image upload
  const handleAiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAiImageFile(file);
      setAiImagePreview(URL.createObjectURL(file));
      setAiError(null);
    }
  };

  // Run AI Scan
  const handleRunAiScan = async () => {
    if (!aiImageFile || !menu) return;
    setAiScanning(true);
    setAiError(null);

    try {
      if (aiCustomKey.trim()) {
        saveGeminiApiKey(aiCustomKey.trim());
      }

      const result = await scanMenuWithGemini(aiImageFile, aiCustomKey.trim() || undefined);

      let newCategories: MenuCategory[] = [];
      if (aiAppendMode === "replace") {
        newCategories = result.categories;
      } else {
        newCategories = [...menu.categories, ...result.categories];
      }

      const updatedMenu: Menu = {
        ...menu,
        businessName: result.businessName || menu.businessName,
        categories: newCategories,
        themeSettings: {
          ...menu.themeSettings,
          currency: result.currency || menu.themeSettings?.currency || "PHP",
        },
      };

      setMenu(updatedMenu);
      await handleSave(updatedMenu);
      setAiModalOpen(false);
      setAiImageFile(null);
      setAiImagePreview(null);
      alert(
        `Successfully scanned menu! Added ${result.categories.length} categories with ${result.categories.reduce(
          (acc, c) => acc + c.items.length,
          0
        )} items.`
      );
    } catch (err: any) {
      console.error("AI Scan failed:", err);
      setAiError(err.message || "Failed to scan menu. Please verify your photo and API key.");
    } finally {
      setAiScanning(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-xs font-mono text-slate-400">LOADING MENU WORKSPACE...</span>
        </div>
      </div>
    );
  }

  if (!menu) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">
                {menu.businessName}
              </h1>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  menu.status === "published"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}
              >
                {menu.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              /menu/{menu.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Edit vs Preview Toggle */}
          <div className="flex lg:hidden bg-slate-800 p-0.5 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setMobileMode("edit")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                mobileMode === "edit"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setMobileMode("preview")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                mobileMode === "preview"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Preview
            </button>
          </div>

          {/* AI Scanner Button */}
          <button
            onClick={() => setAiModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Menu Scanner</span>
            <span className="sm:hidden">Scan AI</span>
          </button>

          {/* View Public Page */}
          <a
            href={`/menu/${menu.slug}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Public Link</span>
          </a>

          {/* Publish / Draft Toggle */}
          <button
            onClick={handleTogglePublish}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              menu.status === "published"
                ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-emerald-600 hover:bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-600/20"
            }`}
          >
            {menu.status === "published" ? "Unpublish" : "Publish Live"}
          </button>

          {/* Manual Save Button */}
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save"}
            </span>
          </button>
        </div>
      </header>

      {/* Main Two-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Customization Controls */}
        <section
          className={`w-full lg:w-[480px] xl:w-[560px] flex-shrink-0 flex flex-col border-r border-slate-800 bg-slate-950 overflow-y-auto p-4 sm:p-6 space-y-6 ${
            mobileMode === "preview" ? "hidden lg:flex" : "flex"
          }`}
        >
        {/* Editor Tabs */}
        <div className="flex border-b border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab("items")}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "items"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories &amp; Items ({menu.categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("business")}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "business"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Store Info &amp; Contacts</span>
          </button>

          <button
            onClick={() => setActiveTab("appearance")}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "appearance"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Theme &amp; Layout</span>
          </button>
        </div>

        {/* TAB 1: CATEGORIES & ITEMS BUILDER */}
        {activeTab === "items" && (
          <div className="space-y-6">
            {/* Top action bar: Add Category */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Organize your menu into sections (e.g. Coffee, Pastries, Main Course).
              </div>

              {!showAddCategoryInput ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAiModalOpen(true)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Scan Menu to Create</span>
                  </button>

                  <button
                    onClick={() => setShowAddCategoryInput(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Category</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Category name (e.g. Signature Coffee)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-56"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  />
                  <button
                    onClick={handleAddCategory}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCategoryInput(false);
                      setNewCategoryName("");
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Categories List */}
            {menu.categories.length === 0 ? (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center">
                <UtensilsCrossed className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">Your menu is empty</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
                  Start by adding your first category or take a photo of your printed menu and let AI scan it automatically!
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setAiModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Scan Menu Photo with AI</span>
                  </button>
                  <button
                    onClick={() => setShowAddCategoryInput(true)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Category Manually</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {menu.categories.map((category) => {
                  const isExpanded = expandedCategories[category.id];
                  const isAddingHere = addingToCategoryId === category.id;

                  return (
                    <div
                      key={category.id}
                      className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm"
                    >
                      {/* Category Header */}
                      <div className="p-4 bg-slate-900/90 border-b border-slate-800/60 flex items-center justify-between">
                        <div
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => toggleCategoryExpanded(category.id)}
                        >
                          <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              <span>{category.name}</span>
                              <span className="text-xs font-normal text-slate-500">
                                ({category.items.length} {category.items.length === 1 ? "item" : "items"})
                              </span>
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startAddItem(category.id)}
                            className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Item</span>
                          </button>

                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/50 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Items Inside Category */}
                      {isExpanded && (
                        <div className="p-4 space-y-3">
                          {/* Add Item Inline Form */}
                          {isAddingHere && (
                            <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-4 space-y-3">
                              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                New Menu Item
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                                    Item Name *
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Iced Caramel Macchiato"
                                    value={editingItemData.name || ""}
                                    onChange={(e) =>
                                      setEditingItemData({ ...editingItemData, name: e.target.value })
                                    }
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    autoFocus
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                                    Price ({menu.themeSettings?.currency || "PHP"}) *
                                  </label>
                                  <input
                                    type="number"
                                    placeholder="150.00"
                                    value={editingItemData.price ?? ""}
                                    onChange={(e) =>
                                      setEditingItemData({
                                        ...editingItemData,
                                        price: parseFloat(e.target.value) || 0,
                                      })
                                    }
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                                  Description / Ingredients
                                </label>
                                <textarea
                                  placeholder="Vanilla syrup, steamed milk, rich espresso, caramel drizzle"
                                  value={editingItemData.description || ""}
                                  onChange={(e) =>
                                    setEditingItemData({ ...editingItemData, description: e.target.value })
                                  }
                                  rows={2}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                                    Photo URL (Optional)
                                  </label>
                                  <input
                                    type="url"
                                    placeholder="https://..."
                                    value={editingItemData.image || ""}
                                    onChange={(e) =>
                                      setEditingItemData({ ...editingItemData, image: e.target.value })
                                    }
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                                    Tags (comma separated)
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="bestseller, iced, signature"
                                    value={(editingItemData.tags || []).join(", ")}
                                    onChange={(e) =>
                                      setEditingItemData({
                                        ...editingItemData,
                                        tags: e.target.value
                                          .split(",")
                                          .map((t) => t.trim())
                                          .filter(Boolean),
                                      })
                                    }
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                              </div>

                              {/* Toggles: Featured & Available */}
                              <div className="flex items-center gap-6 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                                  <input
                                    type="checkbox"
                                    checked={editingItemData.isFeatured || false}
                                    onChange={(e) =>
                                      setEditingItemData({
                                        ...editingItemData,
                                        isFeatured: e.target.checked,
                                      })
                                    }
                                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                                  />
                                  <span>Mark as Popular / Bestseller</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                                  <input
                                    type="checkbox"
                                    checked={editingItemData.isAvailable ?? true}
                                    onChange={(e) =>
                                      setEditingItemData({
                                        ...editingItemData,
                                        isAvailable: e.target.checked,
                                      })
                                    }
                                    className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                                  />
                                  <span>Available (In Stock)</span>
                                </label>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                                <button
                                  onClick={() => {
                                    setAddingToCategoryId(null);
                                    setEditingItemData({});
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveItem(category.id)}
                                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                                >
                                  Add to Menu
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Items List */}
                          {category.items.length === 0 && !isAddingHere ? (
                            <div className="py-6 text-center text-xs text-slate-500">
                              No items in this category yet. Click <strong>+ Add Item</strong> above.
                            </div>
                          ) : (
                            category.items.map((item) => {
                              const isEditingThis = editingItemId === item.id;

                              if (isEditingThis) {
                                return (
                                  <div
                                    key={item.id}
                                    className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-4 space-y-3"
                                  >
                                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                      Edit Item: {item.name}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-[11px] font-medium text-slate-400 block mb-1">
                                          Item Name *
                                        </label>
                                        <input
                                          type="text"
                                          value={editingItemData.name || ""}
                                          onChange={(e) =>
                                            setEditingItemData({
                                              ...editingItemData,
                                              name: e.target.value,
                                            })
                                          }
                                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[11px] font-medium text-slate-400 block mb-1">
                                          Price ({menu.themeSettings?.currency || "PHP"}) *
                                        </label>
                                        <input
                                          type="number"
                                          value={editingItemData.price ?? ""}
                                          onChange={(e) =>
                                            setEditingItemData({
                                              ...editingItemData,
                                              price: parseFloat(e.target.value) || 0,
                                            })
                                          }
                                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="text-[11px] font-medium text-slate-400 block mb-1">
                                        Description
                                      </label>
                                      <textarea
                                        value={editingItemData.description || ""}
                                        onChange={(e) =>
                                          setEditingItemData({
                                            ...editingItemData,
                                            description: e.target.value,
                                          })
                                        }
                                        rows={2}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-[11px] font-medium text-slate-400 block mb-1">
                                          Photo URL
                                        </label>
                                        <input
                                          type="url"
                                          value={editingItemData.image || ""}
                                          onChange={(e) =>
                                            setEditingItemData({
                                              ...editingItemData,
                                              image: e.target.value,
                                            })
                                          }
                                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[11px] font-medium text-slate-400 block mb-1">
                                          Tags (comma separated)
                                        </label>
                                        <input
                                          type="text"
                                          value={(editingItemData.tags || []).join(", ")}
                                          onChange={(e) =>
                                            setEditingItemData({
                                              ...editingItemData,
                                              tags: e.target.value
                                                .split(",")
                                                .map((t) => t.trim())
                                                .filter(Boolean),
                                            })
                                          }
                                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-6 pt-1">
                                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                                        <input
                                          type="checkbox"
                                          checked={editingItemData.isFeatured || false}
                                          onChange={(e) =>
                                            setEditingItemData({
                                              ...editingItemData,
                                              isFeatured: e.target.checked,
                                            })
                                          }
                                          className="rounded border-slate-700 text-amber-500 focus:ring-0"
                                        />
                                        <span>Mark as Popular / Bestseller</span>
                                      </label>

                                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                                        <input
                                          type="checkbox"
                                          checked={editingItemData.isAvailable ?? true}
                                          onChange={(e) =>
                                            setEditingItemData({
                                              ...editingItemData,
                                              isAvailable: e.target.checked,
                                            })
                                          }
                                          className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                                        />
                                        <span>Available (In Stock)</span>
                                      </label>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                                      <button
                                        onClick={() => {
                                          setEditingItemId(null);
                                          setEditingItemData({});
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleSaveItem(category.id)}
                                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                                      >
                                        Update Item
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={item.id}
                                  className="p-3 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/60 rounded-xl flex items-center justify-between gap-3 transition-colors"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {item.image && (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-11 h-11 rounded-lg object-cover bg-slate-800 border border-slate-700/60 flex-shrink-0"
                                      />
                                    )}
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-white truncate">
                                          {item.name}
                                        </span>
                                        {item.isFeatured && (
                                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                            Popular
                                          </span>
                                        )}
                                        {!item.isAvailable && (
                                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                            Sold Out
                                          </span>
                                        )}
                                      </div>
                                      {item.description && (
                                        <p className="text-[11px] text-slate-400 truncate max-w-md">
                                          {item.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-xs font-bold text-emerald-400 font-mono">
                                      {menu.themeSettings?.currency || "₱"}
                                      {item.price.toFixed(2)}
                                    </span>

                                    {/* Availability quick toggle */}
                                    <button
                                      onClick={() =>
                                        handleToggleItemAvailability(category.id, item.id)
                                      }
                                      className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
                                        item.isAvailable
                                          ? "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                                          : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                      }`}
                                      title={item.isAvailable ? "Mark Sold Out" : "Mark Available"}
                                    >
                                      {item.isAvailable ? "In Stock" : "Sold Out"}
                                    </button>

                                    <button
                                      onClick={() => startEditItem(item)}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
                                      title="Edit Item"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>

                                    <button
                                      onClick={() => handleDeleteItem(category.id, item.id)}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/60"
                                      title="Delete Item"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STORE INFO & CONTACTS */}
        {activeTab === "business" && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-400" />
              <span>General Store Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={menu.businessName}
                  onChange={(e) => setMenu({ ...menu, businessName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Menu URL Slug *
                </label>
                <div className="flex items-center">
                  <span className="bg-slate-800 border border-r-0 border-slate-700 rounded-l-xl px-3 py-2 text-xs text-slate-400 font-mono">
                    /menu/
                  </span>
                  <input
                    type="text"
                    value={menu.slug}
                    onChange={async (e) => {
                      const cleanSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "");
                      setMenu({ ...menu, slug: cleanSlug });
                      const available = await isMenuSlugAvailable(cleanSlug, menu.id);
                      setSlugError(available ? null : "This slug is already taken.");
                    }}
                    className={`w-full bg-slate-900 border rounded-r-xl px-3 py-2 text-xs text-white font-mono focus:outline-none ${
                      slugError
                        ? "border-red-500"
                        : "border-slate-700 focus:border-emerald-500"
                    }`}
                  />
                </div>
                {slugError && <p className="text-[11px] text-red-400 mt-1">{slugError}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Tagline / Short Bio
                </label>
                <input
                  type="text"
                  placeholder="e.g. Artisanal Roastery & Craft Pastry Bar"
                  value={menu.tagline || ""}
                  onChange={(e) => setMenu({ ...menu, tagline: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Logo Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={menu.logoUrl || ""}
                  onChange={(e) => setMenu({ ...menu, logoUrl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Cover Photo URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={menu.coverImageUrl || ""}
                  onChange={(e) => setMenu({ ...menu, coverImageUrl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <h3 className="text-sm font-bold text-white pt-4 border-t border-slate-800 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Contact &amp; Social Links</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Store Contact Number
                </label>
                <input
                  type="text"
                  placeholder="+63 912 345 6789"
                  value={menu.contactInfo?.phone || ""}
                  onChange={(e) =>
                    setMenu({
                      ...menu,
                      contactInfo: { ...menu.contactInfo, phone: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Opening Hours
                </label>
                <input
                  type="text"
                  placeholder="Mon-Sun: 8:00 AM – 10:00 PM"
                  value={menu.contactInfo?.openingHours || ""}
                  onChange={(e) =>
                    setMenu({
                      ...menu,
                      contactInfo: { ...menu.contactInfo, openingHours: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Physical Store Address
                </label>
                <input
                  type="text"
                  placeholder="123 Bonifacio High Street, BGC, Taguig City"
                  value={menu.contactInfo?.address || ""}
                  onChange={(e) =>
                    setMenu({
                      ...menu,
                      contactInfo: { ...menu.contactInfo, address: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Instagram Handle / URL
                </label>
                <input
                  type="text"
                  placeholder="@yourcafe or https://..."
                  value={menu.contactInfo?.instagram || ""}
                  onChange={(e) =>
                    setMenu({
                      ...menu,
                      contactInfo: { ...menu.contactInfo, instagram: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Facebook Page / URL
                </label>
                <input
                  type="text"
                  placeholder="facebook.com/yourpage"
                  value={menu.contactInfo?.facebook || ""}
                  onChange={(e) =>
                    setMenu({
                      ...menu,
                      contactInfo: { ...menu.contactInfo, facebook: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleSave()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                Save Store Information
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: THEME & LAYOUT */}
        {activeTab === "appearance" && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              <span>Theme, Styling &amp; Currency</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={menu.themeSettings?.accentColor || "#10b981"}
                    onChange={(e) =>
                      setMenu({
                        ...menu,
                        themeSettings: { ...menu.themeSettings, accentColor: e.target.value },
                      })
                    }
                    className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={menu.themeSettings?.accentColor || "#10b981"}
                    onChange={(e) =>
                      setMenu({
                        ...menu,
                        themeSettings: { ...menu.themeSettings, accentColor: e.target.value },
                      })
                    }
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  placeholder="₱, $, €, ¥"
                  value={menu.themeSettings?.currency || "₱"}
                  onChange={(e) =>
                    setMenu({
                      ...menu,
                      themeSettings: { ...menu.themeSettings, currency: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Items Display Layout
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMenu({
                        ...menu,
                        themeSettings: { ...menu.themeSettings, layout: "list" },
                      })
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      menu.themeSettings?.layout === "list"
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    Compact List
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMenu({
                        ...menu,
                        themeSettings: { ...menu.themeSettings, layout: "grid" },
                      })
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      menu.themeSettings?.layout === "grid"
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    2-Column Grid
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Background Tint
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={menu.themeSettings?.bgColor || "#0b0d14"}
                    onChange={(e) =>
                      setMenu({
                        ...menu,
                        themeSettings: { ...menu.themeSettings, bgColor: e.target.value },
                      })
                    }
                    className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer"
                  />
                  <span className="text-xs text-slate-400 font-mono">
                    {menu.themeSettings?.bgColor || "#0b0d14"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleSave()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                Save Theme Settings
              </button>
            </div>
          </div>
        )}
        </section>

        {/* Right Panel: Real-time Live Phone Mockup Preview */}
        <section
          className={`flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 lg:p-8 overflow-y-auto ${
            mobileMode === "edit" ? "hidden lg:flex" : "flex"
          }`}
        >
          <MenuPhonePreviewFrame menu={menu} />
        </section>
      </div>

      {/* AI SCANNER MODAL */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Menu Photo Scanner</h3>
                  <p className="text-[11px] text-slate-400">Powered by Google Gemini AI</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAiModalOpen(false);
                  setAiError(null);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Upload Area */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                1. Upload Printed Menu Photo (JPG, PNG)
              </label>

              {aiImagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 max-h-56 bg-slate-950 flex items-center justify-center">
                  <img
                    src={aiImagePreview}
                    alt="Menu preview"
                    className="max-h-56 object-contain"
                  />
                  <button
                    onClick={() => {
                      setAiImageFile(null);
                      setAiImagePreview(null);
                    }}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-[10px] font-semibold"
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-700 hover:border-purple-500/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/40">
                  <Upload className="w-8 h-8 text-purple-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-200">
                    Click to browse or drag &amp; drop
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">
                    Clear, well-lit photos of printed menus give the best results
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAiFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Import Mode */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-300 block">
                2. How to Import Scanned Items
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAiAppendMode("append")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    aiAppendMode === "append"
                      ? "bg-purple-600 text-white border-purple-500"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  Append to Existing
                </button>
                <button
                  type="button"
                  onClick={() => setAiAppendMode("replace")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    aiAppendMode === "replace"
                      ? "bg-purple-600 text-white border-purple-500"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  Replace All Items
                </button>
              </div>
            </div>

            {aiError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Run Button */}
            <div className="pt-2">
              <button
                onClick={handleRunAiScan}
                disabled={!aiImageFile || aiScanning}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50 transition-all"
              >
                {aiScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini is reading your menu... (Takes 3-6s)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract Menu Categories &amp; Items</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

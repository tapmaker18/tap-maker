"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { Menu, MenuItem, MenuCategory } from "@/lib/types";
import { getMenuBySlug } from "@/lib/menuStorage";
import {
  UtensilsCrossed,
  Clock,
  MapPin,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Search,
  Sparkles,
  Flame,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Share2,
} from "lucide-react";
import Link from "next/link";

export default function PublicMenuPage() {
  const params = useParams();
  const slug = (params.slug as string)?.toLowerCase().trim();

  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Category refs for scroll tracking
  const categoryRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    if (!slug) {
      setNotFoundState(true);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const data = await getMenuBySlug(slug);
        if (!data) {
          setNotFoundState(true);
        } else {
          setMenu(data);
          document.title = `${data.businessName} — Digital Menu`;
          if (data.categories.length > 0) {
            setActiveCategory(data.categories[0].id);
          }
        }
      } catch (err) {
        console.error("Error loading menu:", err);
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug]);

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = categoryRefs.current[categoryId];
    if (element) {
      const yOffset = -90; // account for sticky header & tabs
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: menu?.businessName || "Menu",
        text: `Check out the menu for ${menu?.businessName}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Filter items based on search query
  const filteredCategories = useMemo(() => {
    if (!menu) return [];
    if (!searchQuery.trim()) return menu.categories.filter((c) => c.isVisible);

    const query = searchQuery.toLowerCase().trim();
    return menu.categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query)) ||
            (item.tags && item.tags.some((t) => t.toLowerCase().includes(query)))
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [menu, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0f17] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-widest text-slate-400">
            LOADING MENU...
          </span>
        </div>
      </div>
    );
  }

  if (notFoundState || !menu) {
    return (
      <div className="min-h-screen bg-[#0d0f17] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mb-4 shadow-xl">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Menu Not Found</h1>
        <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
          The requested menu at <code className="text-emerald-400 font-mono">/menu/{slug}</code> does not exist or has not been published yet.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return Home
        </Link>
      </div>
    );
  }

  // Check if draft
  const isDraft = menu.status === "draft";
  const currencySymbol = menu.themeSettings?.currency || "₱";
  const accentColor = menu.themeSettings?.accentColor || "#10b981"; // emerald default

  return (
    <div
      className="min-h-screen text-slate-100 selection:bg-emerald-500 selection:text-white"
      style={{ backgroundColor: menu.themeSettings?.bgColor || "#0b0d14" }}
    >
      {/* Draft notice banner if not published */}
      {isDraft && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 px-4 py-2.5 text-xs flex items-center justify-center gap-2 sticky top-0 z-50 backdrop-blur-md">
          <Lock className="w-3.5 h-3.5" />
          <span>This menu is currently in <strong>Draft Mode</strong>. Only accessible via preview.</span>
        </div>
      )}

      {/* Header / Hero Section */}
      <header className="relative">
        {/* Cover image or gradient backdrop */}
        <div className="h-44 sm:h-56 w-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
          {menu.coverImageUrl ? (
            <img
              src={menu.coverImageUrl}
              alt={menu.businessName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full opacity-30 flex items-center justify-center">
              <UtensilsCrossed className="w-24 h-24 text-slate-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d14] via-[#0b0d14]/60 to-transparent" />
        </div>

        {/* Business Info Container */}
        <div className="max-w-3xl mx-auto px-4 -mt-16 sm:-mt-20 relative z-10 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              {/* Logo / Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border-2 border-slate-700/80 shadow-2xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                {menu.logoUrl ? (
                  <img
                    src={menu.logoUrl}
                    alt={menu.businessName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-2xl font-bold"
                    style={{ color: accentColor }}
                  >
                    {menu.businessName.charAt(0)}
                  </div>
                )}
              </div>

              <div className="pb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {menu.businessName}
                </h1>
                {menu.tagline && (
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5 line-clamp-1">
                    {menu.tagline}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Menu</span>
                  </>
                )}
              </button>

              {menu.contactInfo?.phone && (
                <a
                  href={`tel:${menu.contactInfo.phone}`}
                  className="px-3.5 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ backgroundColor: accentColor }}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Store</span>
                </a>
              )}
            </div>
          </div>

          {/* Business Meta Badges */}
          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-400">
            {menu.contactInfo?.openingHours && (
              <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{menu.contactInfo.openingHours}</span>
              </div>
            )}
            {menu.contactInfo?.address && (
              <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span className="truncate max-w-xs">{menu.contactInfo.address}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sticky Navigation & Search */}
      <div className="sticky top-0 z-40 bg-[#0b0d14]/90 backdrop-blur-md border-b border-slate-800/80 shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col gap-2.5">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search items or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs (horizontal scroll) */}
          {!searchQuery && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {menu.categories
                .filter((cat) => cat.isVisible)
                .map((category) => {
                  const isActive = activeCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => scrollToCategory(category.id)}
                      className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? "bg-slate-100 text-slate-900 font-semibold shadow-md shadow-white/5"
                          : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/80"
                      }`}
                    >
                      {category.name}
                      <span className="ml-1.5 text-[10px] opacity-60">
                        ({category.items.length})
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Menu Content Area */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {filteredCategories.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No menu items match your search.</p>
            <p className="text-xs text-slate-600 mt-1">Try another keyword or clear search.</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <section
              key={category.id}
              ref={(el) => {
                categoryRefs.current[category.id] = el;
              }}
              className="mb-10 scroll-mt-28"
            >
              {/* Category Heading */}
              <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {category.name}
                  </h2>
                  <span className="text-xs font-mono text-slate-500">
                    {category.items.length} {category.items.length === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>

              {/* Items List or Grid */}
              <div
                className={
                  menu.themeSettings?.layout === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
                    : "flex flex-col gap-3"
                }
              >
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className={`relative p-4 rounded-2xl transition-all border ${
                      item.isAvailable
                        ? "bg-slate-900/60 hover:bg-slate-800/50 border-slate-800/80 hover:border-slate-700/80"
                        : "bg-slate-900/20 border-slate-800/40 opacity-60"
                    }`}
                  >
                    <div className="flex gap-4 items-start">
                      {/* Left: Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
                            {item.name}
                          </h3>

                          {item.isFeatured && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <Sparkles className="w-2.5 h-2.5" /> Popular
                            </span>
                          )}

                          {!item.isAvailable && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              Sold Out
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/50"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Price */}
                        <div className="mt-3">
                          <span
                            className="text-base font-bold"
                            style={{ color: accentColor }}
                          >
                            {currencySymbol}
                            {item.price.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Item Image (if available) */}
                      {item.image && (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700/50">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 px-4 text-center mt-12">
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-sm font-semibold text-slate-300">
            {menu.businessName}
          </div>

          <div className="flex items-center justify-center gap-4 text-slate-400">
            {menu.contactInfo?.instagram && (
              <a
                href={
                  menu.contactInfo.instagram.startsWith("http")
                    ? menu.contactInfo.instagram
                    : `https://instagram.com/${menu.contactInfo.instagram.replace("@", "")}`
                }
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:text-pink-400 transition-colors"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {menu.contactInfo?.facebook && (
              <a
                href={
                  menu.contactInfo.facebook.startsWith("http")
                    ? menu.contactInfo.facebook
                    : `https://facebook.com/${menu.contactInfo.facebook}`
                }
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:text-blue-400 transition-colors"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
            )}
            {menu.contactInfo?.website && (
              <a
                href={menu.contactInfo.website}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:text-emerald-400 transition-colors"
                title="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}
          </div>

          <p className="text-[11px] text-slate-600">
            Powered by <strong className="text-slate-400">Tap-Maker</strong> Digital Menu Studio
          </p>
        </div>
      </footer>
    </div>
  );
}

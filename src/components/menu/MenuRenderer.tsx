"use client";

import React, { useState, useRef, useMemo } from "react";
import { Menu } from "@/lib/types";
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
  Share2,
  CheckCircle2,
} from "lucide-react";

interface MenuRendererProps {
  menu: Menu;
  isPreview?: boolean;
}

export const MenuRenderer: React.FC<MenuRendererProps> = ({ menu, isPreview = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(
    menu.categories?.[0]?.id || ""
  );
  const [copiedLink, setCopiedLink] = useState(false);

  const categoryRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = categoryRefs.current[categoryId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleShare = () => {
    if (isPreview) return;
    if (navigator.share) {
      navigator
        .share({
          title: menu.businessName || "Menu",
          text: `Check out the menu for ${menu.businessName}`,
          url: typeof window !== "undefined" ? window.location.href : "",
        })
        .catch(() => {});
    } else if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!menu.categories) return [];
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
  }, [menu.categories, searchQuery]);

  const currencySymbol = menu.themeSettings?.currency || "₱";
  const accentColor = menu.themeSettings?.accentColor || "#10b981";

  return (
    <div
      className="min-h-full w-full text-slate-100 selection:bg-emerald-500 selection:text-white"
      style={{ backgroundColor: menu.themeSettings?.bgColor || "#0b0d14" }}
    >
      {/* Header / Hero */}
      <header className="relative">
        <div className="h-40 sm:h-48 w-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
          {menu.coverImageUrl ? (
            <img
              src={menu.coverImageUrl}
              alt={menu.businessName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full opacity-30 flex items-center justify-center">
              <UtensilsCrossed className="w-16 h-16 text-slate-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d14] via-[#0b0d14]/60 to-transparent" />
        </div>

        {/* Business Info Header */}
        <div className="px-4 -mt-14 sm:-mt-16 relative z-10 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="flex items-end gap-3.5">
              {/* Logo / Avatar */}
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-2xl overflow-hidden flex-shrink-0 flex items-center justify-center">
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
                    {menu.businessName?.charAt(0) || "M"}
                  </div>
                )}
              </div>

              <div className="pb-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
                  {menu.businessName || "Your Business Name"}
                </h1>
                {menu.tagline && (
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                    {menu.tagline}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-1 sm:pt-0">
              <button
                onClick={handleShare}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </>
                )}
              </button>

              {menu.contactInfo?.phone && (
                <a
                  href={isPreview ? undefined : `tel:${menu.contactInfo.phone}`}
                  className="px-3.5 py-1.5 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-transform hover:scale-105 active:scale-95"
                  style={{ backgroundColor: accentColor }}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              )}
            </div>
          </div>

          {/* Badges: Hours & Address */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-400">
            {menu.contactInfo?.openingHours && (
              <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-lg text-[11px]">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>{menu.contactInfo.openingHours}</span>
              </div>
            )}
            {menu.contactInfo?.address && (
              <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-lg text-[11px] max-w-xs truncate">
                <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                <span className="truncate">{menu.contactInfo.address}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sticky Search & Category Navigation */}
      <div className="sticky top-0 z-30 bg-[#0b0d14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Horizontal Scroll */}
        {!searchQuery && menu.categories && menu.categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {menu.categories
              .filter((cat) => cat.isVisible)
              .map((category) => {
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => scrollToCategory(category.id)}
                    className={`whitespace-nowrap px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                        : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80"
                    }`}
                  >
                    {category.name}
                    <span className="ml-1 text-[10px] opacity-60">
                      ({category.items?.length || 0})
                    </span>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* Categories & Items Content */}
      <main className="px-4 py-5 space-y-8">
        {filteredCategories.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">No menu items to display.</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <section
              key={category.id}
              ref={(el) => {
                categoryRefs.current[category.id] = el;
              }}
              className="scroll-mt-24"
            >
              <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-1.5">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {category.name}
                </h2>
                <span className="text-[11px] font-mono text-slate-500">
                  {category.items.length} {category.items.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div
                className={
                  menu.themeSettings?.layout === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
                    : "flex flex-col gap-2.5"
                }
              >
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      item.isAvailable
                        ? "bg-slate-900/60 hover:bg-slate-800/50 border-slate-800/80"
                        : "bg-slate-900/20 border-slate-800/40 opacity-60"
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-xs sm:text-sm font-semibold text-slate-100">
                            {item.name}
                          </h3>

                          {item.isFeatured && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <Sparkles className="w-2 h-2" /> Popular
                            </span>
                          )}

                          {!item.isAvailable && (
                            <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              Sold Out
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/50"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-2.5">
                          <span
                            className="text-sm font-bold font-mono"
                            style={{ color: accentColor }}
                          >
                            {currencySymbol}
                            {(Number(item.price) || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {item.image && (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700/50">
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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 px-4 text-center mt-8">
        <div className="max-w-md mx-auto space-y-3">
          <div className="text-xs font-semibold text-slate-300">
            {menu.businessName}
          </div>

          <div className="flex items-center justify-center gap-3 text-slate-400">
            {menu.contactInfo?.instagram && (
              <a
                href={
                  isPreview
                    ? undefined
                    : menu.contactInfo.instagram.startsWith("http")
                    ? menu.contactInfo.instagram
                    : `https://instagram.com/${menu.contactInfo.instagram.replace("@", "")}`
                }
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:text-pink-400 transition-colors"
                title="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
            )}
            {menu.contactInfo?.facebook && (
              <a
                href={
                  isPreview
                    ? undefined
                    : menu.contactInfo.facebook.startsWith("http")
                    ? menu.contactInfo.facebook
                    : `https://facebook.com/${menu.contactInfo.facebook}`
                }
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:text-blue-400 transition-colors"
                title="Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
            )}
            {menu.contactInfo?.website && (
              <a
                href={isPreview ? undefined : menu.contactInfo.website}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:text-emerald-400 transition-colors"
                title="Website"
              >
                <Globe className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <p className="text-[10px] text-slate-600">
            Powered by <strong className="text-slate-400">Tap-Maker</strong> Digital Menu Studio
          </p>
        </div>
      </footer>
    </div>
  );
};

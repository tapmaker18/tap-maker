"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Layers,
  Mail,
  Menu as MenuIcon,
  Palette,
  UtensilsCrossed,
  X as XIcon,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { href: "/features", label: "Features", icon: Zap, iconColor: "text-purple-400" },
  { href: "/digital-menus", label: "Digital Menus", icon: UtensilsCrossed, iconColor: "text-emerald-400", accent: "emerald" },
  { href: "/how-it-works", label: "How It Works", icon: Layers, iconColor: "text-indigo-400" },
  { href: "/templates", label: "Templates", icon: Palette, iconColor: "text-amber-400" },
  { href: "/contact", label: "Contact Us", icon: Mail, iconColor: "text-pink-400" },
];

export const SiteNavbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="h-20 w-full max-w-full px-4 sm:px-12 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md flex items-center justify-between gap-2 sticky top-0 z-40 overflow-x-clip">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <img
            src="/logo.svg"
            alt="Tap-Maker"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl shadow-lg shadow-purple-600/30 border border-purple-500/20 object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white block truncate">Tap-Maker</span>
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block -mt-1 truncate">
              Digital Profiles &amp; Menus
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (Dedicated Pages) */}
        <div className="hidden md:flex items-center gap-6 text-xs font-semibold">
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href;
            const isEmerald = item.accent === "emerald";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? isEmerald
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                    : isEmerald
                    ? "text-slate-300 hover:text-emerald-400"
                    : "text-slate-300 hover:text-purple-400"
                }`}
              >
                {isEmerald && <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/editor/new"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <span>Open Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => signOut()}
                className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login?redirect=/editor/new"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger & Actions */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1.5 rounded-xl"
            >
              Studio
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl"
            >
              Sign In
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <XIcon className="w-5 h-5 text-purple-400" />
            ) : (
              <MenuIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-20 bottom-0 w-full max-w-[100vw] overflow-x-hidden z-40 md:hidden flex flex-col justify-between bg-slate-950/95 backdrop-blur-xl border-b border-slate-800">
          <div className="px-4 sm:px-6 py-6 flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-5rem)] w-full">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
              Pages
            </p>

            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between w-full px-3 py-3 rounded-xl text-left text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-purple-600/20 border border-purple-500/30 text-white"
                      : "text-slate-200 hover:bg-slate-900 hover:text-purple-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${item.iconColor}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </Link>
              );
            })}

            <div className="h-px bg-slate-800/80 my-3" />

            <div className="flex flex-col gap-2.5 pt-1">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-center text-sm font-bold text-white transition-all"
                  >
                    Go to Studio Dashboard
                  </Link>
                  <Link
                    href="/editor/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-center text-sm font-bold text-white shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                  >
                    <span>Create Digital Profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login?redirect=/editor/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-center text-sm font-bold text-white shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-center text-sm font-bold text-slate-300 hover:text-white transition-all"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

import React from "react";
import Link from "next/link";

export const SiteFooter: React.FC = () => {
  return (
    <footer className="py-8 px-6 sm:px-12 border-t border-slate-800/80 bg-slate-950 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 mt-auto">
      <div className="flex items-center gap-2.5">
        <img src="/logo.svg" alt="Tap-Maker" className="w-6 h-6 rounded-lg" />
        <p>&copy; {new Date().getFullYear()} Tap-Maker — Digital Profiles &amp; Smart Menus.</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5 font-medium">
        <Link href="/features" className="hover:text-slate-200 transition-colors">
          Features
        </Link>
        <Link href="/digital-menus" className="hover:text-emerald-300 transition-colors">
          Digital Menus
        </Link>
        <Link href="/how-it-works" className="hover:text-slate-200 transition-colors">
          How It Works
        </Link>
        <Link href="/templates" className="hover:text-slate-200 transition-colors">
          Templates
        </Link>
        <Link href="/contact" className="hover:text-slate-200 transition-colors">
          Contact Us
        </Link>
        <Link href="/dashboard" className="hover:text-purple-300 transition-colors">
          Dashboard
        </Link>
      </div>
    </footer>
  );
};

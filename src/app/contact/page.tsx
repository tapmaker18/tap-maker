"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Mail, MessageCircle, Send, User } from "lucide-react";
import { SiteNavbar } from "@/components/landing/SiteNavbar";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { RotatableNfcCard } from "@/components/landing/RotatableNfcCard";

export default function ContactPage() {
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Inquiry from ${contactForm.name}`);
    const body = encodeURIComponent(
      `Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\n${contactForm.message}`
    );
    window.open(`mailto:hello@tap-maker.com?subject=${subject}&body=${body}`);
    setContactSent(true);
    setTimeout(() => setContactSent(false), 4000);
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white">
      <SiteNavbar />

      <main className="flex-1 py-16 px-6 sm:px-12 relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/12 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10 items-start">
          {/* Left: Info, Social Media & Moving Card Preview */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold mb-4">
              <MessageCircle className="w-3.5 h-3.5 text-purple-400" />
              <span>Get In Touch &amp; Custom NFC Orders</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Let&apos;s Work Together. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-400">
                Reach Out Anytime.
              </span>
            </h1>

            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-md">
              Want to order custom Digital Business Cards, Smart Digital Menu table cards, or Social Hub NFC cards? Send us a message or connect on social media.
            </p>

            {/* Social Links */}
            <div className="mt-7 space-y-3 w-full max-w-md">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Follow Us</h2>

              <a
                href="https://facebook.com/tapmaker18"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 hover:bg-blue-950/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-white group-hover:text-blue-300">Facebook</span>
                  <p className="text-[11px] text-slate-500">@tapmaker18</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </a>

              <a
                href="https://instagram.com/tapmaker18"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-pink-500/40 hover:bg-pink-950/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-pink-600/15 border border-pink-500/25 flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-white group-hover:text-pink-300">Instagram</span>
                  <p className="text-[11px] text-slate-500">@tapmaker18</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
              </a>

              <a
                href="https://tiktok.com/@tapmaker18"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-cyan-950/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-600/15 border border-cyan-500/25 flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-white group-hover:text-cyan-300">TikTok</span>
                  <p className="text-[11px] text-slate-500">@tapmaker18</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </a>
            </div>
          </div>

          {/* Right: Contact Form + Moving Hardware Preview */}
          <div className="lg:col-span-6 space-y-6">
            <form
              onSubmit={handleContactSubmit}
              className="rounded-3xl p-6 sm:p-8 bg-slate-900/90 border border-slate-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                  <Send className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Send Us a Message</h2>
                  <p className="text-[11px] text-slate-400">We&apos;ll get back to you as soon as possible</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Juan Dela Cruz"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Tell us about your business, digital menu, or custom NFC card order..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                {contactSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Message Sent!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-slate-500 text-center pt-1">
                Or email us directly at{" "}
                <a href="mailto:hello@tap-maker.com" className="text-purple-400 hover:text-purple-300 font-semibold">
                  hello@tap-maker.com
                </a>
              </p>
            </form>

            <RotatableNfcCard cardIds={["business-card", "menu-card", "social-review"]} size="sm" spinSpeed={22} />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

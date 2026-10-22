"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, notFound } from "next/navigation";
import { Profile } from "@/lib/types";
import { getProfileBySlug, RESERVED_SLUGS } from "@/lib/storage";
import { ProfileRenderer } from "@/components/templates/ProfileRenderer";
import { trackProfileView, trackLinkClick } from "@/lib/analytics";
import { Lock, AlertCircle, ArrowLeft, Smartphone } from "lucide-react";
import Link from "next/link";

import { DEFAULT_PROFILES } from "@/lib/defaultProfiles";

export default function PublicProfilePage() {
  const params = useParams();
  const slug = (params.slug as string)?.toLowerCase().trim();
  const targetSlug = slug;

  const initialProfile =
    DEFAULT_PROFILES.find((p) => p.slug.toLowerCase() === targetSlug) || null;

  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState(!initialProfile);
  const [notFoundState, setNotFoundState] = useState(false);

  // Track page view only once per mount
  const viewTracked = useRef(false);

  useEffect(() => {
    if (!targetSlug || RESERVED_SLUGS.includes(targetSlug)) {
      setNotFoundState(true);
      setLoading(false);
      return;
    }

    async function load() {
      const data = await getProfileBySlug(targetSlug);
      if (!data) {
        if (!initialProfile) {
          setNotFoundState(true);
        }
      } else {
        setProfile(data);
        setNotFoundState(false);
        document.title = `${data.name} — Official Links`;

        // Track profile view (only once)
        if (!viewTracked.current && data.status === "published") {
          viewTracked.current = true;
          trackProfileView(data.id).catch(() => {});
        }
      }
      setLoading(false);
    }
    load();
  }, [targetSlug, initialProfile]);

  // Also track view for profiles loaded from defaults
  useEffect(() => {
    if (
      initialProfile &&
      !viewTracked.current &&
      initialProfile.status === "published"
    ) {
      viewTracked.current = true;
      trackProfileView(initialProfile.id).catch(() => {});
    }
  }, [initialProfile]);

  // Link click handler for analytics
  const handleLinkClick = (linkId: string, linkTitle: string) => {
    if (profile) {
      trackLinkClick(profile.id, linkId, linkTitle).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0814] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider text-slate-500">
            CONNECTING TO PROFILE...
          </span>
        </div>
      </div>
    );
  }

  if (notFoundState || !profile) {
    return (
      <div className="min-h-screen bg-[#0a0814] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-purple-400 mb-4 shadow-xl">
          <Smartphone className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
        <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
          The requested profile <code className="text-purple-400 font-mono">/{slug}</code> does not exist or the link has not yet been assigned to a customer.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all"
        >
          Return to Tap-Maker Home
        </Link>
      </div>
    );
  }

  // Draft or Unpublished Protection
  if (profile.status === "draft" || profile.status === "unpublished") {
    return (
      <div className="min-h-screen bg-[#0a0814] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {profile.status === "draft" ? "Profile in Draft Mode" : "Profile Inactive"}
        </h1>
        <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
          This digital profile for <strong className="text-white">{profile.name}</strong> is currently undergoing customization and is not publicly accessible.
        </p>
        <div className="flex gap-3">
          <Link
            href={`/editor/${profile.id}`}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all"
          >
            Admin Editor
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition-all"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  // Published Profile Rendering with analytics
  return <ProfileRenderer profile={profile} isPreview={false} onLinkClick={handleLinkClick} />;
}


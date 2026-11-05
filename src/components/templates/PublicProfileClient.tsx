"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Lock, Smartphone } from "lucide-react";
import type { Profile } from "@/lib/types";
import { ProfileRenderer } from "@/components/templates/ProfileRenderer";
import { trackLinkClick, trackProfileView } from "@/lib/analytics";

interface PublicProfileClientProps {
  profile: Profile | null;
  slug: string;
}

export function PublicProfileClient({ profile, slug }: PublicProfileClientProps) {
  const viewTracked = useRef(false);

  useEffect(() => {
    if (profile?.status === "published" && !viewTracked.current) {
      viewTracked.current = true;
      trackProfileView(profile.id).catch(() => undefined);
    }
  }, [profile]);

  const handleLinkClick = (linkId: string, linkTitle: string) => {
    if (profile) {
      trackLinkClick(profile.id, linkId, linkTitle).catch(() => undefined);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a0814] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-purple-400 mb-4 shadow-xl">
          <Smartphone className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
        <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
          The requested profile <code className="text-purple-400 font-mono">/{slug}</code> does not exist or the link has not yet been assigned to a customer.
        </p>
        <Link href="/" className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all">
          Return to Tap-Maker Home
        </Link>
      </div>
    );
  }

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
        <Link href="/" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition-all">
          Home
        </Link>
      </div>
    );
  }

  return <ProfileRenderer profile={profile} isPreview={false} onLinkClick={handleLinkClick} />;
}

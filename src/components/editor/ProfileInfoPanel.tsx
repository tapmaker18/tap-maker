"use client";

import React from "react";
import { Profile } from "@/lib/types";
import { User, CheckCircle2, Globe, MapPin, Phone, Mail, Building, Image as ImageIcon } from "lucide-react";

interface ProfileInfoPanelProps {
  profile: Profile;
  onChange: (updated: Profile) => void;
}

export const ProfileInfoPanel: React.FC<ProfileInfoPanelProps> = ({ profile, onChange }) => {
  const updateField = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    onChange({
      ...profile,
      [key]: value,
    });
  };

  const updateContact = (field: string, val: string) => {
    onChange({
      ...profile,
      contactInfo: {
        ...profile.contactInfo,
        [field]: val,
      },
    });
  };

  const updateLayout = (field: string, val: any) => {
    onChange({
      ...profile,
      layoutSettings: {
        ...profile.layoutSettings,
        [field]: val,
      },
    });
  };

  return (
    <div className="flex flex-col gap-5 text-slate-200">
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-purple-400" />
          <span>Profile & Brand Information</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Configure the public details displayed on the digital profile card.
        </p>
      </div>

      {/* 1. Name & URL Slug */}
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Display Name / Business Name *
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Acme Studio or Juan Dela Cruz"
            className="w-full text-sm bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Profile URL Slug *
          </label>
          <div className="flex items-center rounded-xl bg-slate-950 border border-slate-700 overflow-hidden focus-within:border-purple-500">
            <span className="px-3 text-xs text-slate-500 font-mono select-none">
              tap-maker.com/
            </span>
            <input
              type="text"
              value={profile.slug}
              onChange={(e) =>
                updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
              }
              placeholder="companyname"
              className="w-full text-sm bg-transparent py-2.5 pr-3 text-purple-300 font-mono focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            This will be your live public link and encoded into your QR code.
          </p>
        </div>
      </div>

      {/* 2. Photo / Avatar URL & Shape */}
      <div className="flex flex-col gap-3 pt-3 border-t border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
            <span>Avatar or Logo Image URL</span>
            <span className="text-[10px] text-slate-400">PNG, JPG, or SVG</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={profile.avatarUrl}
                onChange={(e) => updateField("avatarUrl", e.target.value)}
                placeholder="Leave empty for Letter Avatar, or paste image URL"
                className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <ImageIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>

            {/* Quick Reset to Letter Avatar */}
            <button
              type="button"
              onClick={() => updateField("avatarUrl", "")}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 whitespace-nowrap"
              title="Reset to dynamic Letter Avatar"
            >
              Letter Avatar
            </button>
          </div>
        </div>

        {/* Avatar Shape Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            Avatar Geometry Shape:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["circle", "rounded-square", "squircle"] as const).map((shape) => (
              <button
                key={shape}
                type="button"
                onClick={() => updateLayout("avatarShape", shape)}
                className={`py-2 px-3 rounded-xl border text-xs capitalize transition-all ${
                  profile.layoutSettings.avatarShape === shape
                    ? "border-purple-500 bg-purple-500/20 text-white font-bold"
                    : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
                }`}
              >
                {shape.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Subtitle & Bio */}
      <div className="flex flex-col gap-3 pt-3 border-t border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Subtitle / Position / Group Members
          </label>
          <input
            type="text"
            value={profile.subtitle}
            onChange={(e) => updateField("subtitle", e.target.value)}
            placeholder="e.g. Angela • Charice • Alexa • Sophia • Charlotte"
            className="w-full text-sm bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Short Bio or Company Mission
          </label>
          <textarea
            rows={3}
            value={profile.bio}
            onChange={(e) => updateField("bio", e.target.value)}
            placeholder="Brief introduction or tagline..."
            className="w-full text-sm bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>

        {/* Verification Badge Toggle */}
        <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              Verified Brand Checkmark Badge
            </span>
          </div>
          <input
            type="checkbox"
            checked={profile.verified}
            onChange={(e) => updateField("verified", e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900"
          />
        </label>
      </div>

      {/* 4. Contact Coordinates */}
      <div className="flex flex-col gap-3 pt-3 border-t border-slate-800">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Contact Coordinates (For Smart Business Card & vCard)
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="email"
              value={profile.contactInfo.email || ""}
              onChange={(e) => updateContact("email", e.target.value)}
              placeholder="Email address"
              className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="relative">
            <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="tel"
              value={profile.contactInfo.phone || ""}
              onChange={(e) => updateContact("phone", e.target.value)}
              placeholder="Mobile / Phone"
              className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={profile.contactInfo.location || ""}
              onChange={(e) => updateContact("location", e.target.value)}
              placeholder="City, Country"
              className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="relative">
            <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="url"
              value={profile.contactInfo.website || ""}
              onChange={(e) => updateContact("website", e.target.value)}
              placeholder="Official website"
              className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="relative sm:col-span-2">
            <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={profile.contactInfo.company || ""}
              onChange={(e) => updateContact("company", e.target.value)}
              placeholder="Company or Organization Name"
              className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

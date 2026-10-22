"use client";

import React, { useState } from "react";
import { Menu } from "@/lib/types";
import { MenuRenderer } from "./MenuRenderer";
import { Smartphone, Tablet, Monitor, Wifi, Battery, Sparkles } from "lucide-react";

interface MenuPhonePreviewFrameProps {
  menu: Menu;
}

export const MenuPhonePreviewFrame: React.FC<MenuPhonePreviewFrameProps> = ({ menu }) => {
  const [deviceMode, setDeviceMode] = useState<"phone" | "tablet" | "full">("phone");

  return (
    <div className="flex flex-col items-center justify-start h-full w-full py-4 px-2 select-none">
      {/* Device Mode Switcher Toolbar */}
      <div className="flex items-center justify-between w-full max-w-sm mb-4 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-lg backdrop-blur-md text-xs text-slate-300">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
          <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
          <span>Real-time Menu Preview</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-full border border-slate-700/50">
          <button
            onClick={() => setDeviceMode("phone")}
            className={`p-1.5 rounded-full transition-all ${
              deviceMode === "phone" ? "bg-emerald-600 text-white shadow-sm" : "hover:text-white"
            }`}
            title="Smartphone Preview (iPhone / Android)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode("tablet")}
            className={`p-1.5 rounded-full transition-all ${
              deviceMode === "tablet" ? "bg-emerald-600 text-white shadow-sm" : "hover:text-white"
            }`}
            title="Tablet Preview"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode("full")}
            className={`p-1.5 rounded-full transition-all ${
              deviceMode === "full" ? "bg-emerald-600 text-white shadow-sm" : "hover:text-white"
            }`}
            title="Expanded Preview"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hardware Mockup Outer Frame */}
      <div
        className={`relative transition-all duration-300 ${
          deviceMode === "phone"
            ? "w-[365px] h-[720px] rounded-[48px] border-[10px] border-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]"
            : deviceMode === "tablet"
            ? "w-[480px] h-[720px] rounded-[36px] border-[10px] border-slate-900 shadow-2xl"
            : "w-full max-w-xl h-[720px] rounded-2xl border-2 border-slate-700 shadow-2xl"
        } bg-[#0b0d14] overflow-hidden flex flex-col`}
      >
        {/* Dynamic Island Notch */}
        {deviceMode === "phone" && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-full z-40 flex items-center justify-between px-3">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-950/80 border border-slate-800" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-900/60" />
          </div>
        )}

        {/* Status Bar */}
        {deviceMode === "phone" && (
          <div className="w-full h-8 px-6 pt-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 z-30 select-none bg-transparent">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Scrollable Viewport with Real-time Menu */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <MenuRenderer menu={menu} isPreview={true} />
        </div>

        {/* Bottom Home Indicator Bar */}
        {deviceMode === "phone" && (
          <div className="w-full py-1.5 flex justify-center bg-black/60 backdrop-blur-sm z-30">
            <div className="w-32 h-1 bg-white/30 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};

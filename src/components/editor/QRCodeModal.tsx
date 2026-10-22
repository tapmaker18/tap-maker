"use client";

import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Profile } from "@/lib/types";
import { X, Copy, Check, Download, QrCode, Smartphone, Zap } from "lucide-react";

interface QRCodeModalProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ profile, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${profile.slug}`
    : `https://tap-maker.com/${profile.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.slug}-qrcode.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Share Link &amp; QR Code</h3>
            <p className="text-xs text-slate-400">{profile.name} • /{profile.slug}</p>
          </div>
        </div>

        {/* QR Code Canvas Card */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-slate-200 shadow-inner my-2">
          <div ref={qrRef}>
            <QRCodeSVG
              value={publicUrl}
              size={220}
              level="H"
              includeMargin={true}
              imageSettings={
                profile.avatarUrl
                  ? {
                      src: profile.avatarUrl,
                      x: undefined,
                      y: undefined,
                      height: 44,
                      width: 44,
                      excavate: true,
                    }
                  : undefined
              }
            />
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-2 font-medium">
            Scan to open profile instantly
          </span>
        </div>

        {/* Public URL Box */}
        <div className="mt-4 flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl">
          <input
            type="text"
            readOnly
            value={publicUrl}
            className="w-full text-xs font-mono bg-transparent text-purple-300 px-2 py-1 outline-none"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all flex-shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy URL"}</span>
          </button>
        </div>

        {/* Download Buttons */}
        <div className="flex gap-2.5 mt-3">
          <button
            onClick={handleDownloadSVG}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Download Vector SVG</span>
          </button>
        </div>

        {/* Card Writing Instruction Card */}
        <div className="mt-5 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 text-xs text-purple-200">
          <div className="flex items-center gap-2 font-bold text-purple-300 mb-1">
            <Smartphone className="w-4 h-4" />
            <span>How to write this link to your card:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 opacity-90 pl-1">
            <li>Download a free <strong>card writer</strong> app (iOS/Android).</li>
            <li>Tap <strong>Write</strong> &rarr; <strong>Add a record</strong> &rarr; <strong>URL / URI</strong>.</li>
            <li>Paste the URL: <code className="text-purple-300 bg-purple-900/50 px-1 py-0.5 rounded font-mono">{publicUrl}</code></li>
            <li>Tap <strong>Write</strong> and hold your physical card to the back of your phone!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

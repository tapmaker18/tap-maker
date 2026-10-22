import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://tap-maker.com"),
  title: "Tap-Maker — Smart Digital Profile & Menu Studio",
  description: "One Tap. Your Entire Digital Presence. Create, brand, and publish responsive digital profiles and smart restaurant menus.",
  icons: {
    icon: "/aura-logo.svg",
    apple: "/aura-logo.svg",
  },
  openGraph: {
    title: "Tap-Maker — Smart Digital Profile & Menu Studio",
    description: "One Tap. Your Entire Digital Presence. Create, brand, and publish responsive digital profiles and smart menus.",
    images: ["/aura-logo.svg"],
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0814",
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

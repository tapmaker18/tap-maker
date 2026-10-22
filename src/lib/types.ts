export type ProfileStatus = "draft" | "published" | "unpublished";

export type TemplateId = "cyber-glow" | "modern-bio" | "executive-card";

export type AvatarShape = "circle" | "rounded-square" | "squircle";
export type ButtonRadius = "sharp" | "rounded" | "pill";
export type ButtonStyle = "glass" | "gradient" | "outline" | "flat";

export interface ColorPalette {
  id: string;
  name: string;
  category: string;
  bgPrimary: string;
  bgSecondary: string;
  accentColor: string;
  secondaryAccent: string;
  textColor: string;
  cardBg: string;
  borderColor: string;
}

export interface ThemeSettings {
  preset: string;
  themeMode: "dark" | "light";
  bgType: "solid" | "gradient" | "mesh";
  bgPrimary: string;
  bgSecondary: string;
  bgGradientAngle: number;
  color1?: string;
  color2?: string;
  additionalColors?: string[];
  accentColor: string;
  secondaryAccent: string;
  textColor: string;
  textSecondaryColor: string;
  cardBg: string;
  cardOpacity: number;
  borderColor: string;
  buttonRadius: ButtonRadius;
  buttonStyle: ButtonStyle;
  enableGlow: boolean;
  enableRipples: boolean;
  enableMeshTexture: boolean;
  fontFamily: "Plus Jakarta Sans" | "Space Grotesk" | "Inter" | "Outfit";
}

export interface LayoutSettings {
  avatarShape: AvatarShape;
  showSubtitlePill: boolean;
  showVerificationBadge: boolean;
  showFooterBranding: boolean;
  footerText?: string;
  sectionSpacing: "compact" | "normal" | "spacious";
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  company?: string;
}

export type PlatformType =
  | "spotify"
  | "youtube"
  | "applemusic"
  | "instagram"
  | "tiktok"
  | "twitter"
  | "facebook"
  | "linkedin"
  | "whatsapp"
  | "telegram"
  | "messenger"
  | "email"
  | "phone"
  | "website"
  | "google"
  | "shopee"
  | "lazada"
  | "custom";

export interface ProfileLink {
  id: string;
  title: string;
  url: string;
  platform: PlatformType;
  category: "music" | "social" | "contact" | "featured" | "products" | "other";
  icon?: string;
  badge?: string | null;
  isActive: boolean;
  isHighlighted: boolean;
  sortOrder: number;
  appUrl?: {
    android?: string;
    ios?: string;
  };
}

export interface ProfileSection {
  id: string;
  title: string;
  sectionKey: string;
  isVisible: boolean;
  sortOrder: number;
}

export interface Profile {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  bio: string;
  avatarUrl: string;
  templateId: TemplateId;
  themeSettings: ThemeSettings;
  layoutSettings: LayoutSettings;
  contactInfo: ContactInfo;
  links: ProfileLink[];
  sections: ProfileSection[];
  status: ProfileStatus;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  userId?: string;
}

// ============================================================
// Menu System Types (Digital Restaurant/Café Menu)
// ============================================================

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  image?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  tags?: string[];
  sortOrder: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
  items: MenuItem[];
  isVisible: boolean;
  sortOrder: number;
}

export interface MenuThemeSettings {
  accentColor: string;
  bgColor: string;
  textColor: string;
  cardStyle: "clean" | "glass" | "bordered";
  fontFamily: string;
  showPrices: boolean;
  currency: string;
  layout: "grid" | "list";
}

export interface MenuContactInfo {
  phone?: string;
  address?: string;
  openingHours?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
}

export interface Menu {
  id: string;
  slug: string;
  businessName: string;
  tagline?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  categories: MenuCategory[];
  themeSettings: MenuThemeSettings;
  contactInfo: MenuContactInfo;
  status: "draft" | "published";
  userId: string;
  createdAt: string;
  updatedAt: string;
}

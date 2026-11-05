# TMaker — Production-Ready NFC Digital Profile Template Maker
## Architecture Specification, Implementation Roadmap & System Design

---

## 1. Executive Summary & Project Overview

**TMaker** is a production-grade Software-as-a-Service (SaaS) platform tailored for an NFC digital business card & smart profile business. As the administrator and service provider, you can create, customize, preview, manage, and publish high-performance, mobile-first digital profile pages for clients across various verticals (creators, musicians, enterprises, executives, and brands).

Each customer profile is linked to a clean, unique URL (e.g. `tmaker.com/companyname`, `tmaker.com/juan`, `tmaker.com/aura`), which is programmed onto physical NFC cards or smart tags. Tapping the NFC card with any smartphone immediately opens the customer's digital hub.

### Core System Requirements
1. **Firebase Authentication (Sign In & Sign Up)**:
   - Mandatory authentication guard: Users cannot create or edit profile templates without logging in.
   - Dual-mode auth: Email/Password (Sign In & Sign Up) with persistent session tracking.
   - Unauthenticated attempts to access `/editor/*` or create a new profile are automatically intercepted and redirected to `/login`.
2. **Direct-To-Full-Editor Creation ("Rekta sa Buong Profile Editor")**:
   - Creating a new profile bypasses any restrictive mini-wizards.
   - Immediately initializes a full draft and loads the complete two-panel reactive editor with all capabilities active:
     - Profile Info & Contacts
     - Links & Categorized Socials
     - Theme Studio: Color 1 (Primary), Color 2 (Secondary), and dynamic "+ Add Color" list
     - Layout & Template Switcher
     - Live interactive phone preview frame & QR generator.
3. **Dedicated Branding & Letter Avatars**:
   - Clean Letter Avatar (initials on brand gradient) as default whenever no custom logo/photo is uploaded.
   - Official vector logos for showcase profiles (Aura and Acme).

---

## 2. System Architecture & Tech Stack

```
                              ┌──────────────────────────────────────────────┐
                              │            TMaker Web Platform               │
                              │           (Next.js App Router)               │
                              └──────────────────────┬───────────────────────┘
                                                     │
         ┌───────────────────────────┬───────────────┴───────────────┬───────────────────────────┐
         ▼                           ▼                               ▼                           ▼
 ┌───────────────┐           ┌───────────────┐               ┌───────────────┐           ┌───────────────┐
 │   Homepage    │           │ Login/SignUp  │               │   Dashboard   │           │ Dynamic Slug  │
 │     `/`       │           │   `/login`    │               │  & 2-Panel    │           │   `/:slug`    │
 │ Premium SaaS  │           │ Firebase Auth │               │   Editor      │           │ Public Mobile │
 │ Landing & CTA │           │ Email/Password│               │  Live Preview │           │ NFC Renderer  │
 └───────────────┘           └───────────────┘               └───────┬───────┘           └───────┬───────┘
                                                                     │                           │
                                     ┌───────────────────────────────┴───────────────────────────┘
                                     ▼
                      ┌─────────────────────────────┐
                      │    Storage & Data Layer     │
                      │  • Firebase Firestore       │
                      │  • Local Storage (Cache v5) │
                      │  • Local Storage Dev-Mode   │
                      │    Fallback Engine          │
                      └─────────────────────────────┘
```

### Core Technologies
- **Framework**: Next.js 14+ (App Router) with TypeScript & React Server/Client Components.
- **Styling**: Tailwind CSS + Custom CSS Variables + Vanilla CSS animations + Lucide React.
- **UI System**: Clean, accessible component system modeled after Framer/Linear/shadcn aesthetics.
- **Data Layer & Authentication**:
  - **Firebase**: Cloud Firestore (NoSQL realtime database), Firebase Auth (admin session management), and Firebase Storage (avatar and image uploads).
  - **Zero-Config Development Fallback**: Embedded local-storage and mock provider enabling immediate local development and offline workflow even prior to supplying live Firebase project keys.
- **QR Code & NFC Utilities**: `qrcode.react` with SVG & PNG download capabilities for physical NFC card provisioning.
- **Validation**: Zod schema validation for profile fields, URL safety checks, and slug collision avoidance.

---

## 4. Application Structure & Routes

| Route | Access | Purpose |
| :--- | :--- | :--- |
| `/` | Public | Premium SaaS landing page explaining NFC profiles, features, interactive demo, and contact. |
| `/login` | Public / Auth | Secure admin authentication portal. |
| `/dashboard` | Protected (Admin) | Profile inventory, statistics, draft/published counts, search, and CRUD action center. |
| `/editor/new` | Protected (Admin) | Direct-to-full-editor creation route (rekta sa buong profile customizer). |
| `/editor/:id` | Protected (Admin) | Split-screen real-time visual customizer (controls on left, reactive smartphone preview on right). |
| `/:slug` | Public | Customer digital profile loaded by slug (e.g. `/aura`, `/acme`, `/juan`). |

> **Reserved Slugs Protection**: Routes like `dashboard`, `editor`, `login`, `api`, `templates`, `settings`, `admin`, and `public` are strictly blacklisted from being claimed as customer profile slugs.

---

## 5. Database Schema & Architecture (Firebase Firestore & Firebase Auth)

We will use **Firebase** for backend, database, authentication, and asset storage:
- **Firebase Firestore**: Document-based real-time NoSQL database.
- **Firebase Auth**: Admin email/password authentication with secure session handling.
- **Firebase Storage**: Cloud storage bucket for client avatars, logos, and custom background images.
- **Zero-Config Dev Fallback**: LocalStorage / mock fallback adapter when Firebase credentials are not yet configured in `.env.local`.

### Firestore Structure

#### Collection: `profiles`
Document ID: `slug` or `profileId` (Each document represents a customer profile)

```json
{
  "id": "kaia-uuid",
  "slug": "kaia",
  "name": "KAIA",
  "subtitle": "Angela • Charice • Alexa • Sophia • Charlotte",
  "bio": "Filipino P-pop girl group under Sony Music Philippines & ShowBT. Defining inner character (kinaiya) and power (kaya). Home of ZAIA",
  "avatarUrl": "https://i.scdn.co/image/ab6761610000e5eb97f681f8e6e1d04f5b7867d2",
  "templateId": "cyber-glow",
  "themeSettings": {
    "preset": "cyber-glow",
    "themeMode": "dark",
    "bgPrimary": "#0a0814",
    "bgSecondary": "#131024",
    "accentColor": "#a37bf7",
    "secondaryAccent": "#1bdfcf",
    "textColor": "#f8fafc",
    "buttonRadius": "18px",
    "enableGlow": true,
    "enableRipples": true
  },
  "layoutSettings": {
    "avatarShape": "circle",
    "showSubtitlePill": true,
    "showVerificationBadge": true,
    "showFooterBranding": true
  },
  "contactInfo": {
    "email": "management@kaiaph.com",
    "phone": "+639123456789",
    "location": "Manila, Philippines",
    "website": "https://open.spotify.com/artist/5UWPjwwieMFFohWLHe4Usy"
  },
  "status": "published", // "draft" | "published" | "unpublished"
  "verified": true,
  "createdAt": "2026-10-19T14:00:00Z",
  "updatedAt": "2026-10-19T14:00:00Z",
  "publishedAt": "2026-10-19T14:00:00Z"
}
```

#### Subcollection or Nested Array: `links` (or `profiles/{profileId}/links`)
```json
[
  {
    "id": "link-1",
    "title": "Listen on Spotify",
    "url": "https://open.spotify.com/artist/5UWPjwwieMFFohWLHe4Usy",
    "platform": "spotify",
    "category": "music",
    "icon": "spotify",
    "badge": "★ LATEST MUSIC",
    "isActive": true,
    "isHighlighted": true,
    "appUrl": {
      "android": "intent://artist/5UWPjwwieMFFohWLHe4Usy#Intent;package=com.spotify.music;scheme=spotify;S.browser_fallback_url=https%3A%2F%2Fopen.spotify.com%2Fartist%2F5UWPjwwieMFFohWLHe4Usy;end;"
    },
    "sortOrder": 0
  },
  {
    "id": "link-2",
    "title": "YouTube Official Channel",
    "url": "https://www.youtube.com/@KAIAOfficialph",
    "platform": "youtube",
    "category": "music",
    "icon": "youtube",
    "badge": "MV & EXCLUSIVES",
    "isActive": true,
    "isHighlighted": true,
    "sortOrder": 1
  }
]
```

### Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Anyone can read a published profile by slug
    match /profiles/{profileId} {
      allow read: if resource.data.status == 'published' || request.auth != null;
      allow write: if request.auth != null; // Only authenticated admin can create/update/delete
      
      match /links/{linkId} {
        allow read: if get(/databases/$(database)/documents/profiles/$(profileId)).data.status == 'published' || request.auth != null;
        allow write: if request.auth != null;
      }
    }
  }
}
```

### Firebase Storage Rules (`storage.rules`)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{allPaths=**} {
      allow read: if true; // Public can see profile avatars
      allow write: if request.auth != null; // Only admin can upload
    }
  }
}
```

---

## 6. Template & Customization System

### Three Core Layout Engines
1. **Cyber Glow / KAIA Style**:
   - Deep cyber background, pulsing glow aura, animated button ripples, pill badges, and category labels.
2. **Modern Link-in-Bio**:
   - Ultra-clean, contemporary card stack with customizable corner radiuses, soft drop shadows, and minimalist iconography.
3. **Executive Digital Business Card**:
   - Corporate card layout featuring quick vCard download, direct dial/email quick-actions, location tags, and company branding.

### Theme Customization & Multi-Color Brand Engine
Dahil nakadepende ang bawat profile sa specific branding/colors ng company o client, may kasamang **Advanced Color & Palette Customization Engine**:

1. **Interactive Full Color Pickers (EyeDropper + Hex/RGB/HSL)**:
   - **Primary Brand Color** (Active highlights, major CTA buttons, avatar rings).
   - **Secondary / Accent Color** (Glow effects, gradient endpoints, special badges).
   - **Background Customizer**:
     - Solid color mode.
     - Dual/Triple-stop Linear Gradient (may angle selector: 45°, 90°, 135°, 180°).
     - Radial Ambient Mesh Glow (katulad ng KAIA background pero gumagamit ng brand colors ng client).
   - **Card / Surface Color**: Glassmorphism transparency slider (0% to 100%), card background tint, at border color/glow.
   - **Typography Colors**: Heading color, subtitle color, bio text, at link button text.

2. **Pre-Engineered Brand Color Combinations (1-Click Palettes)**:
   - 🏢 **Corporate Enterprise**: Navy Blue (`#0f172a`) + Slate Cyan (`#0ea5e9`) + Crisp White
   - ⚡ **Cyber / Music / Entertainment (KAIA Style)**: Deep Violet (`#0a0814`) + Electric Purple (`#a37bf7`) + Neon Turquoise (`#1bdfcf`)
   - 👑 **Luxury & Real Estate**: Obsidian Black (`#121212`) + Metallic Gold (`#d4af37`) + Warm Champagne (`#f5e6c8`)
   - 🌿 **Eco / Wellness / Organic**: Forest Sage (`#1c2826`) + Emerald Mint (`#10b981`) + Soft Cream
   - ☕ **Artisan & Café**: Warm Espresso (`#271b16`) + Caramel Terracotta (`#ea580c`) + Latte Foam
   - 💎 **Modern Clean Tech**: Pure Snow White (`#ffffff`) + Pitch Black (`#09090b`) + Electric Indigo (`#6366f1`)
   - 🌸 **Beauty & Fashion**: Soft Rose Velvet (`#1f131a`) + Pastel Blush (`#f472b6`) + Silver Lavender
   - 🍔 **Food & Hospitality**: Crimson Red (`#991b1b`) + Warm Amber (`#f59e0b`) + Cream White
   - 🚀 **Fintech & Web3**: Midnight Space (`#030712`) + Matrix Lime (`#84cc16`) + Vibrant Teal

3. **Color Harmony Generator & Contrast Checker**:
   - Automatic button to generate **Complementary**, **Analogous**, or **Triadic** color schemes mula sa base logo color ng client.
   - Built-in **WCAG 2.1 Contrast Checker** para sigurado na laging readable ang text sa mobile screen kahit maliwanag o madilim ang napiling kulay.
   - Real-time CSS Custom Variables (`--brand-primary`, `--brand-secondary`, `--brand-bg`, `--brand-card`, `--brand-glow`) na nag-a-apply agad sa right-panel live preview nang walang refresh.

4. **Geometry & Visual FX**:
   - Profile photo shape: Circle, Rounded Square (Squircle), Hexagon.
   - Button corner radius: Sharp (4px), Modern Rounded (12px-18px), Full Pill (9999px).
   - Button styles: Solid Glass, Gradient Fill, Outline / Neon Stroke, Minimal Flat.
   - Animations & FX: Pulsing avatar border, card ripple clicks, floating background glow particles.

---

## 7. Admin Workflow & NFC Card Provisioning

```
 ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
 │ 1. Log In       │  ──►  │ 2. Create       │  ──►  │ 3. Choose       │
 │    to TMaker    │       │    Profile      │       │    Template     │
 └─────────────────┘       └─────────────────┘       └─────────────────┘
                                                              │
                                                              ▼
 ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
 │ 6. Publish      │  ◄──  │ 5. Review Live  │  ◄──  │ 4. Customize    │
 │    Profile      │       │    Mobile Prew  │       │    Data & Links │
 └────────┬────────┘       └─────────────────┘       └─────────────────┘
          │
          ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │ 7. Generated URL: `https://tmaker.com/kaia`                         │
 │    • Instant copy button                                            │
 │    • Dynamic QR Code with SVG/PNG download                          │
 └──────────────────────────────────┬──────────────────────────────────┘
                                    │
                                    ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │ 8. Write URL to NFC Chip using standard NFC Tools (iOS/Android)     │
 │ 9. Hand card to customer ── Tapping card opens profile instantly!    │
 └─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Detailed Phased Implementation Plan

- **Phase 1: Project Setup & Foundation**
  - Next.js 14 App Router, TypeScript, Tailwind CSS configuration.
  - Google Fonts integration (`Plus Jakarta Sans`, `Space Grotesk`).
  - Base responsive shell and metadata configs.
- **Phase 2: Data Models & Persistence Engine**
  - TypeScript interfaces for `Profile`, `ProfileLink`, `ThemeSettings`, and `LayoutSettings`.
  - Dual storage manager: Local storage / in-memory store for instant offline development + Firebase SDK (Firestore & Firebase Auth) for production.
  - Initial seed data mirroring the existing KAIA template.
- **Phase 3: Template Renderer Subsystem**
  - Port existing KAIA CSS and animations into dynamic modular React components (`CyberGlowTemplate`).
  - Implement `ModernBioTemplate` and `ExecutiveCardTemplate`.
  - Dynamic icon mapper supporting 18+ platforms (Spotify, YouTube, Instagram, Facebook, TikTok, WhatsApp, Telegram, etc.).
- **Phase 4: Two-Panel Live Editor (`/editor/[id]`)**
  - Left panel: Multi-tab accordion (Profile Details, Links & Categories, Theme Styling & Brand Color Pickers, Template Switcher, NFC Tools).
  - Advanced Theme Studio: Interactive Hex/RGB/HSL picker, multi-stop gradient builder, 1-click industry brand palettes (Corporate, Luxury, Cyber, Eco, Food, Tech), and WCAG contrast check.
  - Right panel: Interactive smartphone preview with real-time state reactivity.
  - Mobile responsive toggle (Switch between Edit Controls and Preview).
- **Phase 5: Admin Dashboard (`/dashboard`) & Auth Guard**
  - KPI overview: Total profiles, Published vs Drafts.
  - Searchable, filterable profile list with actions: Edit, Quick Preview, Copy URL, QR Code modal, Duplicate, Delete, Publish/Unpublish.
  - Clean login screen with session handling (Firebase Auth).
- **Phase 6: Public Profile Dynamic Engine (`/:slug`)**
  - Fast server-side rendering for public profiles with automatic OpenGraph / Twitter Cards meta tags.
  - Reserved routes safety barrier and draft/unpublished protective screens.
- **Phase 7: SaaS Landing Page (`/`)**
  - High-converting hero section with interactive 3D/glass preview.
  - Interactive feature breakdown, demo selector, and footer.
- **Phase 8: Validation, Documentation & Deployment**
  - TypeScript compile verification, linting, and responsive testing.
  - Full `README.md`, `.env.example`, and Firebase rules (`firestore.rules`, `storage.rules`).
- **Phase 9: Hardware-Locked Member Approval System & Multi-Tenant Management**
  - **Email-Only Authentication**: Removal of Google OAuth provider to streamline authentication and eliminate domain whitelist issues.
  - **Account Status Lifecycle**:
    - `pending`: Newly registered accounts await manual Super Admin approval (verified against physical card/tag purchases).
    - `approved`: Full access to Studio Dashboard, Digital Profile Builder, and Digital Menu Editor.
    - `suspended`: Deactivated account barred from dashboard and editor.
  - **Customer Onboarding Details**: Business/Brand Name, Phone/Contact, and Order Reference captured on Sign Up.
  - **Pending Verification Waiting Room**: Non-intrusive waiting screen for pending members with auto-refresh poll and direct Messenger/WhatsApp CTA to expedite order verification.
  - **Super Admin Member Control Hub (`/dashboard`)**:
    - Super Admin: `adriancalicdan2@gmail.com` boots an immutable Firebase custom role claim: `super_admin`. All ongoing authorization relies on that claim, not an editable Firestore field.
    - Filter tabs: `All`, `Pending` (with notification count badge), `Active`, `Suspended`.
    - 1-Click Quick Actions: **Approve**, **Suspend**, **Delete User**, and **+ Add 5 AI Scans**.
    - **"+ Add Account" Modal**: Super Admin creates and instantly approves accounts directly for physical card customers.
  - **Member Monitoring**: Admin inspects profiles, menus, and views generated by each member.
  - **AI Token Quota Protection**: Default 5 scans per account with usage tracking and admin top-up to preserve Gemini API Free Tier limits.
  - **Server-Side Enforcement**: Approval, suspension, top-ups, account creation/deletion, and quota consumption run through Firebase Admin endpoints. Firestore rules allow browser users to create only pending records and to edit only their own contact details.
  - **Deployment Requirement**: Configure server-only Firebase Admin credentials and `GEMINI_API_KEY`, then deploy `firestore.rules` and `storage.rules` before enabling this phase in production.

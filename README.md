# TMaker — NFC Digital Profile Template Maker

> **One Tap. Your Entire Digital Presence.**
> A production-grade SaaS platform for creating, customizing, managing, and publishing digital profile pages linked to physical NFC business cards.

---

## 🌟 Key Features

1. **Multi-Layout Profile System**:
   - **Cyber Glow / Neon Studio**: Ambient radial glow mesh, pulsing avatar glow rings, full-color SVG platform icons, ripple clicks, and mobile intent deep links.
   - **Modern Link-in-Bio**: Clean, minimalist, social-first presentation for creators and modern agencies.
   - **Executive Digital Business Pass**: Professional card layout with **1-Tap vCard Download** directly importing contacts to iOS / Android address books.

2. **Brand Theme & Multi-Color Combination Studio**:
   - **Interactive Hex/RGB/Eyedropper Pickers** for Primary Brand, Secondary Accent, Background, and Text colors.
   - **9 Curated Brand Palettes** (Corporate Navy, Cyber Neon, Luxury Gold, Modern Clean White, Eco Forest, Artisan Warmth, Fintech Space, Rose Velvet, Crimson Pulse).
   - **WCAG 2.1 Contrast Checker** for high legibility on mobile screens.
   - Dynamic CSS variable injection for real-time live preview with zero page reloads.

3. **Two-Panel Live Visual Editor (`/editor/:id`)**:
   - Split-screen controls on desktop: configuration on the left, reactive phone mockup on the right.
   - Responsive mobile toggle between Edit and Preview modes.
   - Instant reordering, categorization, and badges (e.g. `★ LATEST MUSIC`).

4. **Public NFC Profile Engine (`/:slug`)**:
   - Dynamic URLs: `tmaker.com/companyname`, `tmaker.com/juan`, `tmaker.com/aura`.
   - Reserved route protection: `/dashboard`, `/editor`, `/login`, `/api` are strictly protected.
   - Draft and unpublished status guards.
   - High-performance, mobile-first design optimized for NFC smartphone taps.

5. **Integrated QR Code & NFC Tooling**:
   - Live vector SVG & PNG QR code generator with customer avatar overlay.
   - Step-by-step NFC chip programming tutorial.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Styling**: Tailwind CSS + Custom CSS Variables & Animations + Lucide React
- **Backend & Auth**: Firebase Firestore + Firebase Auth + Firebase Storage, with Firebase Admin for protected account actions
- **Local Dev Engine**: Zero-config LocalStorage fallback for instant offline development
- **QR Codes**: `qrcode.react` with vector SVG download

---

## 🚀 Quick Start & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Homepage**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Cyber Glow Profile Demo**: [http://localhost:3000/aura](http://localhost:3000/aura)
- **Executive Card Demo**: [http://localhost:3000/juan](http://localhost:3000/juan)
- **Modern Bio Demo**: [http://localhost:3000/acme](http://localhost:3000/acme)
- **Admin Login**: [http://localhost:3000/login](http://localhost:3000/login)

---

## 🔐 Environment Configuration (`.env.local`)

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

```env
# Public Site Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="TMaker — NFC Digital Profile Studio"

# Firebase Configuration (Optional in local development; falls back to embedded LocalStorage engine)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Server-only Firebase Admin credentials. These are required in a deployed
# environment for approvals, suspensions, account creation/deletion, and AI quotas.
FIREBASE_SERVICE_ACCOUNT_JSON='{"project_id":"...","client_email":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"}'

# Server-only Gemini key for the menu scanner. Do not use NEXT_PUBLIC_.
GEMINI_API_KEY=your_gemini_key
```

## Super Admin setup

1. Create the Firebase Authentication account for the Super Admin address and verify its email address.
2. Set `FIREBASE_SERVICE_ACCOUNT_JSON` (or the three equivalent server variables) in the deployment environment; never expose it to the browser.
3. Sign in once with `adriancalicdan2@gmail.com`. The app assigns the verified owner an immutable Firebase custom `super_admin` role through the server-only bootstrap endpoint. All later admin access is based on that claim, not a client-editable Firestore field.
4. Deploy the updated `firestore.rules` and `storage.rules` before enabling the member-management UI.

---

## 📲 How to Write Published URLs to Physical NFC Cards

1. Open TMaker Admin Dashboard and click **Publish** on the client profile.
2. Click **QR & NFC** to copy the public URL (e.g. `https://tmaker.com/companyname`).
3. Download the free **NFC Tools** app on your iPhone or Android.
4. In NFC Tools:
   - Select **Write**
   - Tap **Add a record** &rarr; select **URL / URI**
   - Paste the public profile URL
   - Tap **Write**
5. Hold your physical NFC card (NTAG213, NTAG215, or NTAG216) to the top back of your smartphone until you see the green checkmark.
6. **Done!** Whenever anyone taps the card against an iPhone or Android, their digital profile opens instantly in their browser with no app installation required.

---

## 🛡️ Production Deployment

1. Deploy the Next.js repository to **Vercel**, **Firebase Hosting**, or **Render**.
2. Add your custom domain (e.g. `tmaker.com`) in your DNS provider (Cloudflare / Namecheap / GoDaddy) with CNAME pointing to your host.
3. Apply the security rules from `firestore.rules` and `storage.rules` in your Firebase Console.

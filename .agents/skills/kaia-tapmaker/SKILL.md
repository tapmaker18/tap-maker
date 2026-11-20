---
name: kaia-tapmaker
description: Comprehensive architecture, feature reference, and operational guide for the KAIA / Tap-Maker B2B NFC Digital Profile & Restaurant Menu Studio application.
---

# KAIA / Tap-Maker Studio — Full Application Skill & Technical Reference

## 1. Overview & Business Model
**Tap-Maker Studio (KAIA)** is a B2B SaaS platform for creating, customizing, and hosting smart NFC digital business cards/profiles (`/[slug]`) and interactive digital restaurant/café menus (`/menu/[slug]`).

- **3-Tier Role-Based Access Control (RBAC):**
  1. **Super Admin (`super_admin`):** Platform owner (`adriancalicdan2@gmail.com`). Has unlimited card tokens, unlimited AI quota, approves/suspends client accounts, allocates card tokens (`cardTokensLimit`), toggles Full AI Builder access (`allowAiPageBuilder`), and oversees all client and customer accounts.
  2. **Client / Reseller (`member`):** Approved B2B client who orders physical NFC cards. Each card token (`1 token = 1 digital slot + 1 customer seat`) allows creating a Digital Profile or Digital Menu and handing over edit access of a menu to an end-customer.
  3. **Customer (`customer`):** End-business owner or staff (e.g., restaurant/café owner) created by a Client via a one-time password setup link. Can only view and edit menus assigned to them (`menuAccess/{menuId}`), with brand/theme design locked.

---

## 2. Tech Stack
- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS, Lucide Icons, custom scoped CSS engine
- **Authentication:** Firebase Authentication (Email/Password) + Firebase Admin SDK Custom Claims (`role`, `parentClientId`)
- **Database:** Cloud Firestore (`users`, `profiles`, `menus`, `menuAccess`, `menus/{id}/changelog`, `profiles/{id}/analytics`) with client-side `localStorage` fallback
- **AI Engine:**
  - **Primary / Fast Vision & JSON:** Groq (`qwen/qwen3.8-27b`, capped at `max_tokens: 750` for free-tier 1000 OTPM compliance)
  - **Fallback Chain:** Google Gemini (`gemini-3.8-flash` → `gemini-3.8-flash-lite` → `gemini-flash-latest`)
- **Image Pipeline:** Client-side HTML5 Canvas compression (`src/lib/imageUpload.ts`) encoding images to optimized base64 DataURLs (~15–35 KB) stored directly in Firestore documents with a 1 MB document size guard (`src/lib/docSize.ts`).

---

## 3. Directory & File Architecture

| File Path | Purpose & How It Works |
|---|---|
| `src/lib/types.ts` | All TypeScript interfaces: `Profile`, `Menu`, `MenuCategory`, `MenuItem`, `MemberAccount`, `UserRole`, `CustomerPreset`, `MenuAccess`, `MenuChangeLogEntry`. |
| `src/lib/admin.ts` | Defines `SUPER_ADMIN_EMAIL` (`adriancalicdan2@gmail.com`), `SUPER_ADMIN_ROLE`, and `isSuperAdminEmail()`. |
| `src/lib/firebase.ts` | Client-side Firebase SDK initialization (`auth`, `db`, `storage`, `analytics`). |
| `src/lib/firebaseAdmin.ts` | Server-only Firebase Admin SDK initialization (`getAdminAuth`, `getAdminDb`), bearer ID-token verification (`verifyAuthenticatedRequest`, `verifyAdminRequest`), and Super Admin custom claim bootstrap (`bootstrapAdminClaim`). |
| `src/context/AuthContext.tsx` | Global React auth provider exposing `user`, `memberAccount`, `role`, `isAdmin`, `isClient`, `isCustomer`, `isApproved`, `isPending`, `isSuspended`, `signIn`, `signUp`, `signOut`. |
| `src/lib/storage.ts` | Profile CRUD (`getProfiles`, `getProfileById`, `getProfileBySlug`, `isSlugAvailable`, `createProfile`, `saveProfile`, `deleteProfile`, `duplicateProfile`). Uses `/api/assets` for creation and slug checks. |
| `src/lib/menuStorage.ts` | Menu CRUD (`getMenus`, `getMenuById`, `getMenuBySlug`, `isMenuSlugAvailable`, `createMenu`, `saveMenu`, `deleteMenu`, `duplicateMenu`). Uses `/api/assets` for creation and slug checks. |
| `src/lib/userStorage.ts` | Client/Admin member account helpers and `/api/admin/members` caller functions. |
| `src/lib/assetApi.ts` | Client wrapper for `/api/assets` (`checkSlugRemote`, `createAssetRemote`). |
| `src/lib/customerServer.ts` | Server-side RBAC helpers (`resolveCaller`, `assertClientOrAdmin`, `assertCustomer`), field sanitizers per `CustomerPreset` (`applyCustomerChanges`), and automatic human-readable diff generator (`diffMenu`). |
| `src/lib/customerApi.ts` | Client wrapper for `/api/customers` (client/admin managing customers) and `/api/customer/menus` (customer reading/saving assigned menus). |
| `src/lib/docSize.ts` | Calculates UTF-8 byte size of Firestore payloads and enforces the 1 MB document limit (`assertDocSize`). |
| `src/lib/rateLimit.ts` | Sliding-window rate limiter and progressive brute-force lockout store (`60s` → `5m` → `15m`) with automatic LRU/TTL pruning. |
| `src/middleware.ts` | Next.js Edge Middleware providing global `/api/*` per-IP sliding-window DDoS rate limiting, exploit path blocking (`.env`, `.git`, `wp-admin`), payload size caps, and CSRF Origin verification. |
| `src/app/api/auth/guard/route.ts` | Server-side login brute-force, signup spam, password-reset limiter, and honeypot bot guard. |
| `src/app/api/assets/route.ts` | Server-side transaction endpoint enforcing `cardTokensLimit` and global slug uniqueness when creating profiles or menus. |
| `src/app/api/admin/members/route.ts` | Super Admin API to create client accounts, approve/suspend members, adjust AI scan limits, adjust card tokens, and toggle Full AI Builder permission. |
| `src/app/api/customers/route.ts` | Client & Super Admin API to list, create, assign/unassign menus, generate password setup links, enable/disable, delete customer sub-accounts, and inspect customer edit changelogs. |
| `src/app/api/customer/menus/route.ts` | Customer-only API to list assigned menus, fetch a menu with its changelog, and save permitted fields inside a Firestore transaction with optimistic concurrency (`expectedUpdatedAt`) and automatic changelog recording. |
| `src/app/api/ai/auto-style/route.ts` | AI Theme & Full Page Builder endpoint (Gemini 3.8 Flash + Groq `qwen/qwen3.8-27b`). Supports `theme_only` and `full` builder modes, automatic quota refund on failure, progressive JSON salvage, and dark-mode contrast auto-correction. |
| `src/app/api/ai/scan-menu/route.ts` | AI Menu OCR photo scanner converting physical menu photos into structured categories and priced items, with automatic quota refund on failure. |
| `src/app/dashboard/page.tsx` | Main studio dashboard. Renders `CustomerDashboard` for `customer` role, or the tabbed studio (`Digital Profiles`, `Digital Menus`, `My Customers` / `Customer Accounts`, and Super Admin `Client Accounts`). |
| `src/components/customers/CustomersPanel.tsx` | Client/Admin UI for handing over menus to customers, copying one-time password setup links and ready-to-send welcome messages, managing presets (`content` vs `quick_edit`), and viewing edit history. |
| `src/components/customers/CustomerDashboard.tsx` | Streamlined dashboard for logged-in `customer` accounts showing only their assigned menus. |
| `src/app/customer/menu/[id]/page.tsx` | Dedicated Customer Menu Editor featuring mobile-first 1-tap `Available` / `Sold Out` toggles, inline price editing, `Mark "Closed Today"` button, full item/category CRUD (for `content` preset), live phone preview, and changelog history. |
| `src/app/editor/[id]/page.tsx` | Full two-panel Digital Profile studio editor. |
| `src/app/editor/menu/[id]/page.tsx` | Full two-panel Digital Menu studio editor for Clients and Super Admin. |

---

## 4. Key Workflows & How Functions Work

### A. Card Token & Slug Uniqueness Enforcement
- Every profile or menu creation (`createProfile`, `createMenu`, `duplicateProfile`, `duplicateMenu`) calls `POST /api/assets` (`action: "create"`).
- Inside a Firestore transaction, the server verifies:
  1. The caller is an approved `member` or `super_admin` (customers are blocked).
  2. The requested slug is not reserved and does not exist in Firestore across all users' drafts and published items.
  3. Total owned `profiles + menus` is strictly less than `cardTokensLimit` (unless Super Admin).

### B. Customer Handover & 3-Tier RBAC Flow
1. **Handover Creation:** In `Dashboard` → `Digital Menus` → `Customer Access` (or `My Customers` tab), the Client selects a menu, enters the customer's email and business name, and chooses a preset:
   - `content`: Can edit categories, items, photos, prices, availability, tagline, contact info, and action buttons.
   - `quick_edit`: Can only toggle item `Available` / `Sold Out`, edit item prices, and update opening hours.
2. **One-Time Setup Link:** `POST /api/customers` (`action: "create"`) creates the Firebase Auth user with custom claims `{ role: "customer", parentClientId }`, writes the `users/{uid}` and `menuAccess/{menuId}` documents, and generates a Firebase password-setup link (`generatePasswordResetLink`).
3. **Server-Guarded Customer Saves:** When a customer saves in `/customer/menu/[id]`, `POST /api/customer/menus` (`action: "save"`):
   - Verifies the customer's UID is in `menuAccess/{menuId}.editorIds`.
   - Checks `expectedUpdatedAt` to prevent overwriting concurrent edits (`409 Conflict`).
   - Sanitizes and whitelists only the fields allowed by the customer's preset (`applyCustomerChanges`), keeping `themeSettings`, `slug`, `status`, and `userId` locked.
   - Computes a human-readable diff (`diffMenu`) and writes an audit entry to `menus/{menuId}/changelog`.

### C. Security, Rate Limiting & Anti-DDoS Architecture
- **Edge Shield (`src/middleware.ts`):**
  - Blocks exploit scanners (`/.env`, `/.git`, `/wp-admin`, `/phpmyadmin`, `/xmlrpc.php`) with `404`.
  - Enforces per-IP sliding-window rate limits (`12/min` on `/api/ai/*`, `25/min` on `/api/auth/*`, `45/min` on `/api/admin/*` & `/api/customers`, `60/min` on general APIs, `120/min` global burst).
  - Enforces payload size limits (`12 MB` multipart AI, `2 MB` JSON) and CSRF `Origin` === `Host` verification.
- **Auth Guard (`/api/auth/guard` & `src/app/login/page.tsx`):**
  - Honeypot hidden input (`company_website_hp`) traps automated bots.
  - Progressive lockout (`60s` → `5m` → `15m`) after 5 failed login attempts per IP+Email or 15 per IP, with a live countdown timer on the login button.
  - Rate-limits sign-ups (`4 per 15m per IP`) and password resets (`3 per 15m per IP/Email`).
  - Sanitizes `redirect` query parameters against open-redirect phishing.

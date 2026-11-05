# Tap-Maker: NFC Card Token / Coin Quota System Specification & Plan

## 1. Overview & Business Model
Sa Tap-Maker B2B model, ang bawat physical NFC card na binibili ng client ay may katumbas na **1 Digital Creation Slot (1 Token/Coin)**.

- **1 Token / Coin = 1 NFC Card Slot**
  - **1 Digital Profile** = 1 Token
  - **1 Digital Menu** = 1 Token
- **Pooled / Shared Allocation**:
  - Kung umorder ang client ng 3 physical cards, bibigyan sila ni Super Admin ng **3 Tokens**.
  - Pwede nilang hatiin kung paano nila gagamitin:
    - Halimbawa: 2 Profiles + 1 Menu = 3 Tokens (Total: 3/3 used).
  - **Slot Reclamation**: Kung magbura ang client ng lumang profile o menu na hindi na ginagamit sa card, maibabalik ang token slot para magamit muli sa card.
- **Super Admin Privilege**:
  - Ang Super Admin (`adriancalicdan2@gmail.com`) ay laging **Unlimited** at exempt sa token limits.

---

## 2. Data Model Changes

### `MemberAccount` (`src/lib/types.ts`)
```typescript
export interface MemberAccount {
  uid: string;
  email: string;
  businessName: string;
  contactName?: string;
  phone?: string;
  orderRef?: string;
  status: AccountStatus;
  role: UserRole;
  
  // Card Token / Creation Quota
  cardTokensLimit: number; // Kabuuang cards/tokens na binili ng client (default: 1)
  
  // Existing AI Menu Scan Quota
  aiScansLimit: number;
  aiScansUsed: number;
  
  createdAt: string;
  approvedAt?: string | null;
  lastLoginAt?: string | null;
}
```

---

## 3. Super Admin Features

### A. Pag-create ng Bagong Client Account
- Sa modal na **"Create Client Account"** (`/dashboard`):
  - Bagong input field: **"NFC Card Tokens / Creation Quota"**
  - Description: *"Dami ng cards na binili ng client (1 Token = 1 Profile o 1 Menu)."*
  - Default value: `1` (editable: 1, 2, 5, 10, etc.).

### B. Pag-manage / Pag-top up ng Tokens para sa Existing Client
- Sa Client Card / Table sa Super Admin tab:
  - May display: `🪙 Tokens: X / Y Used (Z Available)`
  - May action button: **"Edit / Add Tokens"**
  - Modal para makapag-dagdag ng tokens (e.g., nag-reorder ng +2 cards) o direktang i-adjust ang limit.

### C. Backend API (`/api/admin/members/route.ts`)
- `action === "create"`: Tanggapin at i-save ang `cardTokensLimit` (default `1`).
- `action === "set-card-tokens"`: Tanggapin ang `uid` at bagong `cardTokensLimit`.
- `action === "add-card-tokens"`: Quick increment ng `cardTokensLimit` gamit ang `FieldValue.increment(count)`.

---

## 4. Client Dashboard & Creation Enforcement (Harang)

### A. Client Dashboard Header
- Magpakita ng **Card Allowance Banner / Widget**:
  - `🪙 Available Card Tokens: X / Y Used`
  - Kapag 0 na ang remaining:
    - Visual badge: `All Card Slots Used`
    - Helper link/text: *"Need more profiles or menus? Order additional NFC cards."*

### B. Dashboard Button Gatekeeper
- Sa Dashboard buttons:
  - **"+ Create New Profile"**
  - **"+ Create Digital Menu"**
- Kung `usedTokens >= cardTokensLimit` (para sa non-admin):
  - I-disable ang button o gawing locked.
  - Magpakita ng informative modal/tooltip: *"Naabot mo na ang limit ng iyong order (X/X cards). Mag-order ng karagdagang card sa admin upang makagawa pa."*

### C. Direct Route Protection (`/editor/new` & `/editor/menu/new`)
- Bago i-initialize ang draft sa `/editor/new` at `/editor/menu/new`:
  - I-verify ang `usedTokens` laban sa `cardTokensLimit`.
  - Kung ubos na ang token, i-redirect pabalik sa `/dashboard` na may error notification.

---

## 5. Login Page Security & Sign Up Restriction
- Dahil **Super Admin lang ang may pahintulot gumawa ng account ng clients**:
  - Aalisin ang public **"Sign Up"** tab sa `/login` page.
  - Ang `/login` ay magiging strictly:
    - **Sign In** (Email + Password)
    - **Forgot Password**
  - Maiiwasan ang uninvited visitors na mag-create ng account nang walang valid card order.

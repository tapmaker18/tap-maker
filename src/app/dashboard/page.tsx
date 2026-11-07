"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Profile } from "@/lib/types";
import { Menu } from "@/lib/types";
import {
  getProfiles,
  saveProfile,
  deleteProfile,
  duplicateProfile,
} from "@/lib/storage";
import {
  getMenus,
  deleteMenu,
  duplicateMenu,
} from "@/lib/menuStorage";
import { getAllAnalyticsSummaries, AnalyticsSummary } from "@/lib/analytics";
import { QRCodeModal } from "@/components/editor/QRCodeModal";
import { LetterAvatar } from "@/components/ui/LetterAvatar";
import { PendingApprovalScreen } from "@/components/auth/PendingApprovalScreen";
import {
  getAllMembers,
  updateMemberStatus,
  addMemberAiScans,
  deleteMemberAccount,
  createMemberByAdmin,
  setMemberCardTokens,
  addMemberCardTokens,
} from "@/lib/userStorage";
import { MemberAccount, AccountStatus } from "@/lib/types";
import {
  Plus,
  Search,
  Globe,
  Edit,
  Copy,
  Trash2,
  QrCode,
  ExternalLink,
  CheckCircle,
  Eye,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  ArrowUpRight,
  LogOut,
  FolderLock,
  Shield,
  Users,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  MousePointerClick,
  BarChart3,
  UtensilsCrossed,
  TrendingUp,
  Check,
  X,
  UserCheck,
  UserX,
  Clock,
  Key,
  ShieldAlert,
  RefreshCw,
  Mail,
  Phone,
  Tag,
  Building2,
  Bot,
  UserPlus,
  CreditCard,
  Coins,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type DashboardTab = "profiles" | "menus" | "members";

const SUPER_ADMIN_EMAIL = "adriancalicdan2@gmail.com";

function isSuperAdminMember(member: MemberAccount): boolean {
  return (
    member.role === "super_admin" ||
    member.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, memberAccount, loading: authLoading, signOut, isAdmin, isPending, isSuspended } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [loading, setLoading] = useState(true);
  const [activeQrProfile, setActiveQrProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("profiles");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // Admin: which user's profiles to view ("all" or specific userId)
  const [adminUserFilter, setAdminUserFilter] = useState<string>("all");
  const [showUserList, setShowUserList] = useState(false);
  // Analytics data
  const [analytics, setAnalytics] = useState<Record<string, AnalyticsSummary>>({});
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Members Management state (Super Admin)
  const [members, setMembers] = useState<MemberAccount[]>([]);
  const [memberFilter, setMemberFilter] = useState<"all" | "pending" | "approved" | "suspended">("all");
  const [memberSearch, setMemberSearch] = useState("");
  const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);
  const [addAccountForm, setAddAccountForm] = useState({
    email: "",
    pass: "",
    businessName: "",
    phone: "",
    orderRef: "",
    aiScansLimit: 5,
    cardTokensLimit: 1,
  });
  const [addAccountLoading, setAddAccountLoading] = useState(false);
  const [addAccountMsg, setAddAccountMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Manage Card Tokens Modal State (Super Admin)
  const [tokensModalOpen, setTokensModalOpen] = useState(false);
  const [selectedMemberForTokens, setSelectedMemberForTokens] = useState<MemberAccount | null>(null);
  const [tokensInput, setTokensInput] = useState<number>(1);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokensMsg, setTokensMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Member token limits (1 card = 1 profile or menu)
  const clientTokenLimit = memberAccount?.cardTokensLimit ?? 1;
  const clientTokensUsed = profiles.length + menus.length;
  const clientTokensRemaining = Math.max(0, clientTokenLimit - clientTokensUsed);
  const isTokensExhausted = !isAdmin && clientTokensUsed >= clientTokenLimit;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [user, authLoading, router]);

  const loadAnalytics = async (profileList: Profile[]) => {
    if (!profileList.length) return;
    setAnalyticsLoading(true);
    try {
      const profileIds = profileList.map((p) => p.id);
      const analyticsData = await getAllAnalyticsSummaries(profileIds);
      setAnalytics(analyticsData);
    } catch (err) {
      console.warn("Error loading analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadProfiles = async () => {
    if (!user) return;
    try {
      const list = await getProfiles(user.uid, isAdmin);
      setProfiles(list);
      loadAnalytics(list);
    } catch (err) {
      console.warn("Error loading profiles:", err);
    }
  };

  const loadMenus = async () => {
    if (!user) return;
    try {
      const list = await getMenus(user.uid, isAdmin);
      setMenus(list);
    } catch (err) {
      console.warn("Error loading menus:", err);
    }
  };

  const loadMembers = async () => {
    if (!isAdmin) return;
    try {
      const list = await getAllMembers();
      setMembers(list);
    } catch (err) {
      console.warn("Error loading members:", err);
    }
  };

  const handleApproveMember = async (uid: string) => {
    await updateMemberStatus(uid, "approved");
    await loadMembers();
  };

  const handleSuspendMember = async (uid: string) => {
    await updateMemberStatus(uid, "suspended");
    await loadMembers();
  };

  const handleReactivateMember = async (uid: string) => {
    await updateMemberStatus(uid, "approved");
    await loadMembers();
  };

  const handleAddAiScans = async (uid: string) => {
    await addMemberAiScans(uid, 5);
    await loadMembers();
  };

  const handleDeleteMember = async (uid: string, name: string) => {
    if (confirm(`Are you sure you want to delete account "${name}"? This cannot be undone.`)) {
      await deleteMemberAccount(uid);
      await loadMembers();
    }
  };

  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAccountLoading(true);
    setAddAccountMsg(null);
    try {
      await createMemberByAdmin(addAccountForm);
      setAddAccountMsg({
        type: "success",
        text: `Account "${addAccountForm.businessName}" created and pre-approved!`,
      });
      await loadMembers();
      setTimeout(() => {
        setAddAccountModalOpen(false);
        setAddAccountForm({
          email: "",
          pass: "",
          businessName: "",
          phone: "",
          orderRef: "",
          aiScansLimit: 5,
          cardTokensLimit: 1,
        });
        setAddAccountMsg(null);
      }, 1200);
    } catch (err: any) {
      setAddAccountMsg({
        type: "error",
        text: err.message || "Failed to create account.",
      });
    } finally {
      setAddAccountLoading(false);
    }
  };

  const handleSaveMemberTokens = async (mode: "set" | "add", count: number) => {
    if (!selectedMemberForTokens) return;
    setTokensLoading(true);
    setTokensMsg(null);
    try {
      if (mode === "add") {
        await addMemberCardTokens(selectedMemberForTokens.uid, count);
      } else {
        await setMemberCardTokens(selectedMemberForTokens.uid, count);
      }
      setTokensMsg({
        type: "success",
        text: `Successfully updated card tokens for ${selectedMemberForTokens.businessName}!`,
      });
      await loadMembers();
      setTimeout(() => {
        setTokensModalOpen(false);
        setSelectedMemberForTokens(null);
        setTokensMsg(null);
      }, 900);
    } catch (err: any) {
      setTokensMsg({
        type: "error",
        text: err.message || "Failed to update tokens.",
      });
    } finally {
      setTokensLoading(false);
    }
  };

  const handleCreateProfileClick = () => {
    if (isTokensExhausted) {
      alert(
        `Card Token Limit Reached!\n\nYou have used all ${clientTokenLimit} digital slot(s) for your ordered NFC cards (${profiles.length} profiles, ${menus.length} menus).\n\nPlease contact the Super Admin to order additional physical cards or top up your account.`
      );
      return;
    }
    router.push("/editor/new");
  };

  const handleCreateMenuClick = () => {
    if (isTokensExhausted) {
      alert(
        `Card Token Limit Reached!\n\nYou have used all ${clientTokenLimit} digital slot(s) for your ordered NFC cards (${profiles.length} profiles, ${menus.length} menus).\n\nPlease contact the Super Admin to order additional physical cards or top up your account.`
      );
      return;
    }
    router.push("/editor/menu/new");
  };

  // Fast initial load: runs profiles, menus, and members concurrently, unblocks UI immediately
  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileList, menuList, memberList] = await Promise.all([
        getProfiles(user.uid, isAdmin),
        getMenus(user.uid, isAdmin),
        isAdmin ? getAllMembers() : Promise.resolve([]),
      ]);
      setProfiles(profileList);
      setMenus(menuList);
      if (isAdmin) {
        setMembers(memberList);
      }
      // Background analytics fetch (non-blocking)
      loadAnalytics(profileList);
    } catch (err) {
      console.warn("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !isPending && !isSuspended) {
      loadDashboardData();
    }
  }, [user, isAdmin, isPending, isSuspended]);

  const handleDuplicate = async (id: string) => {
    const dup = await duplicateProfile(id, user?.uid);
    if (dup) {
      await loadProfiles();
      router.push(`/editor/${dup.id}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete profile "${name}"? This cannot be undone.`)) {
      await deleteProfile(id);
      await loadProfiles();
    }
  };

  const handleTogglePublish = async (profile: Profile) => {
    const newStatus = profile.status === "published" ? "draft" : "published";
    await saveProfile({
      ...profile,
      status: newStatus,
    });
    await loadProfiles();
  };

  const handleDeleteMenu = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete menu "${name}"? This cannot be undone.`)) {
      await deleteMenu(id);
      await loadMenus();
    }
  };

  const handleDuplicateMenu = async (id: string) => {
    const dup = await duplicateMenu(id, user?.uid);
    if (dup) {
      await loadMenus();
      router.push(`/editor/menu/${dup.id}`);
    }
  };

  // Get unique users from profiles (admin only)
  const uniqueUsers = React.useMemo(() => {
    if (!isAdmin) return [];
    const userMap = new Map<string, { userId: string; email?: string; count: number }>();
    profiles.forEach((p) => {
      if (p.userId) {
        const existing = userMap.get(p.userId);
        if (existing) {
          existing.count++;
        } else {
          userMap.set(p.userId, { userId: p.userId, count: 1 });
        }
      }
    });
    return Array.from(userMap.values());
  }, [profiles, isAdmin]);

  const getOwnerDisplayName = (userId?: string): string => {
    if (!userId) return "Tap-Maker Studio";
    const foundMember = members.find((m) => m.uid === userId);
    if (foundMember) {
      return foundMember.businessName || foundMember.contactName || foundMember.email;
    }
    if (user && user.uid === userId) {
      return user.displayName || user.email || "You";
    }
    return "Client Account";
  };

  // Filter profiles based on search (name, slug, business name, company, or creator), status, and admin user filter
  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase().trim();
    const ownerName = getOwnerDisplayName(p.userId).toLowerCase();
    const company = (p.contactInfo?.company || "").toLowerCase();
    const subtitle = (p.subtitle || "").toLowerCase();

    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      ownerName.includes(q) ||
      company.includes(q) ||
      subtitle.includes(q);

    const matchesStatus =
      filterStatus === "all" ? true : p.status === filterStatus;
    const matchesUser =
      !isAdmin || adminUserFilter === "all" ? true : p.userId === adminUserFilter;
    return matchesSearch && matchesStatus && matchesUser;
  });

  const filteredMenus = menus.filter((m) => {
    const q = search.toLowerCase().trim();
    const ownerName = getOwnerDisplayName(m.userId).toLowerCase();
    const tagline = (m.tagline || "").toLowerCase();

    const matchesSearch =
      !q ||
      (m.businessName || "").toLowerCase().includes(q) ||
      (m.slug || "").toLowerCase().includes(q) ||
      ownerName.includes(q) ||
      tagline.includes(q);

    const matchesStatus =
      filterStatus === "all" ? true : m.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalProfiles = profiles.length;
  const publishedCount = profiles.filter((p) => p.status === "published").length;
  const draftCount = profiles.filter((p) => p.status === "draft").length;

  // Aggregate analytics for KPI
  const totalViews = Object.values(analytics).reduce((sum, a) => sum + (a.totalViews || 0), 0);
  const totalClicks = Object.values(analytics).reduce((sum, a) => sum + (a.totalClicks || 0), 0);

  // Pending Approval Gate: Unapproved members cannot enter studio dashboard
  if (!authLoading && user && (isPending || isSuspended)) {
    return <PendingApprovalScreen />;
  }

  // Super Admin Member stats
  const clientMembers = members.filter((m) => !isSuperAdminMember(m));
  const pendingCount = clientMembers.filter((m) => m.status === "pending").length;
  const activeMembersCount = clientMembers.filter((m) => m.status === "approved").length;
  const suspendedCount = clientMembers.filter((m) => m.status === "suspended").length;
  const totalAiScansUsed = clientMembers.reduce((sum, m) => sum + (m.aiScansUsed || 0), 0);

  // Filter members for Super Admin management tab
  const filteredMembers = clientMembers.filter((m) => {
    const matchesFilter = memberFilter === "all" ? true : m.status === memberFilter;
    const q = memberSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (m.businessName || "").toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q) ||
      (m.contactName && m.contactName.toLowerCase().includes(q)) ||
      (m.phone && m.phone.toLowerCase().includes(q)) ||
      (m.orderRef && m.orderRef.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Dashboard Top Header */}
      <header className="h-16 px-4 sm:px-8 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <Link
          href="/"
          className="flex items-center gap-3 group hover:opacity-90 transition-opacity cursor-pointer"
          title="Return to Landing Page"
        >
          <img
            src="/logo.svg"
            alt="Tap-Maker"
            className="w-9 h-9 rounded-2xl shadow-lg shadow-purple-600/30 border border-purple-500/20 object-cover group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-purple-300 transition-colors">
                Tap-Maker Studio
              </span>
              {isAdmin && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  Super Admin
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-purple-400 transition-colors block -mt-0.5">
              ← Visit Landing Page
            </span>
          </div>
        </Link>

        {/* Right Header Navigation with User Dropdown */}
        <div className="flex items-center gap-3">
          {/* Member Card Token Quota Display (Regular Approved Members) */}
          {!isAdmin && memberAccount && (
            <div
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-semibold ${
                isTokensExhausted
                  ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                  : "bg-amber-500/15 border-amber-500/30 text-amber-300"
              }`}
              title={`Card Slots Quota: 1 Card = 1 Profile or Menu. You have used ${clientTokensUsed} of ${clientTokenLimit} slots.`}
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="sm:hidden font-mono text-white text-[11px]">
                {clientTokensUsed}/{clientTokenLimit}
              </span>
              <span className="hidden sm:inline">
                Cards: <strong className="font-mono text-white">{clientTokensUsed}/{clientTokenLimit}</strong>
                {isTokensExhausted ? " (Full)" : ` (${clientTokensRemaining} left)`}
              </span>
            </div>
          )}

          {/* User Profile Dropdown Pill */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all text-left cursor-pointer active:scale-95"
                aria-label="User Account Menu"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Avatar"
                    className="w-7 h-7 rounded-full border border-slate-600 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="hidden sm:flex flex-col min-w-0 max-w-[130px]">
                  <span className="text-xs font-bold text-white truncate leading-tight">
                    {user.displayName || user.email?.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-purple-400 font-medium leading-tight">
                    {isAdmin ? "Super Admin" : "Client Account"}
                  </span>
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    userMenuOpen ? "rotate-180 text-white" : ""
                  }`}
                />
              </button>

              {/* User Dropdown Floating Menu */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl z-50 p-3 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-2">
                      <p className="font-bold text-white text-sm truncate">
                        {user.displayName || user.email}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                      {isAdmin ? (
                        <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                          <Shield className="w-2.5 h-2.5" />
                          Super Admin Role
                        </span>
                      ) : (
                        <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                          <Tag className="w-2.5 h-2.5" />
                          Client Member
                        </span>
                      )}
                    </div>

                    {!isAdmin && memberAccount && (
                      <div className="space-y-1.5 px-3 py-2 border-t border-slate-800/80 mb-2 text-[11px] text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-amber-400" />
                            Card Slots:
                          </span>
                          <span className="font-mono font-bold text-white">
                            {clientTokensUsed} / {clientTokenLimit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            AI Scans:
                          </span>
                          <span className="font-mono font-bold text-white">
                            {memberAccount.aiScansUsed || 0} / {memberAccount.aiScansLimit || 5}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 pt-1 border-t border-slate-800/80">
                      <Link
                        href="/"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>Visit Landing Page</span>
                      </Link>

                      <button
                        onClick={async () => {
                          setUserMenuOpen(false);
                          await signOut();
                          router.push("/login");
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out of Studio</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-6">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("profiles")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 whitespace-nowrap ${
              activeTab === "profiles"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Digital Profiles</span>
          </button>
          <button
            onClick={() => setActiveTab("menus")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 whitespace-nowrap ${
              activeTab === "menus"
                ? "bg-orange-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Digital Menus</span>
            {menus.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10">
                {menus.length}
              </span>
            )}
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab("members")}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 whitespace-nowrap ${
                activeTab === "members"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Client Accounts</span>
              {pendingCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
                  {pendingCount} Pending
                </span>
              ) : clientMembers.length > 0 ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10">
                  {clientMembers.length}
                </span>
              ) : null}
            </button>
          )}
        </div>

        {/* Super Admin: Pending Accounts Action Banner */}
        {isAdmin && pendingCount > 0 && activeTab !== "members" && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{pendingCount} Client Account{pendingCount > 1 ? "s" : ""} Pending Review</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">Action Required</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verify physical card orders and grant studio access with one click.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTab("members");
                setMemberFilter("pending");
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex-shrink-0 cursor-pointer self-start sm:self-auto shadow-md shadow-amber-500/20"
            >
              Review Accounts →
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* PROFILES TAB */}
        {/* ============================================================ */}
        {activeTab === "profiles" && (
          <>
            {/* Admin Users Panel */}
            {isAdmin && (
              <div className="rounded-3xl bg-gradient-to-r from-amber-500/5 to-purple-500/5 border border-amber-500/20 p-5">
                <button
                  onClick={() => setShowUserList(!showUserList)}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-white">User Accounts</h3>
                      <p className="text-[11px] text-slate-400">
                        {uniqueUsers.length} registered user{uniqueUsers.length !== 1 ? "s" : ""} • {totalProfiles} total profile{totalProfiles !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {showUserList ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showUserList && (
                  <div className="mt-4 space-y-2">
                    {/* All Users filter */}
                    <button
                      onClick={() => setAdminUserFilter("all")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left ${
                        adminUserFilter === "all"
                          ? "bg-purple-600/10 border-purple-500/30 text-white"
                          : "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold">All Users</span>
                        <p className="text-[10px] text-slate-500">{totalProfiles} profiles</p>
                      </div>
                    </button>

                    {/* Individual user filters */}
                    {uniqueUsers.map((u) => (
                      <button
                        key={u.userId}
                        onClick={() => setAdminUserFilter(u.userId)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left ${
                          adminUserFilter === u.userId
                            ? "bg-purple-600/10 border-purple-500/30 text-white"
                            : "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold truncate block">
                            {u.userId.substring(0, 12)}...
                          </span>
                          <p className="text-[10px] text-slate-500">{u.count} profile{u.count !== 1 ? "s" : ""}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Statistics Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {isAdmin ? "Total Profiles" : "My Profiles"}
                  </p>
                  <h2 className="text-3xl font-extrabold text-white mt-1">
                    {totalProfiles}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Smartphone className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Published
                  </p>
                  <h2 className="text-3xl font-extrabold text-white mt-1">
                    {publishedCount}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Globe className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Drafts
                  </p>
                  <h2 className="text-3xl font-extrabold text-white mt-1">
                    {draftCount}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <FolderLock className="w-6 h-6" />
                </div>
              </div>

              {/* NEW: Analytics KPI - Total Views */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    Total Views
                  </p>
                  <h2 className="text-3xl font-extrabold text-white mt-1">
                    {analyticsLoading ? "..." : totalViews.toLocaleString()}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Eye className="w-6 h-6" />
                </div>
              </div>

              {/* NEW: Analytics KPI - Total Clicks */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-pink-400 uppercase tracking-wider">
                    Total Clicks
                  </p>
                  <h2 className="text-3xl font-extrabold text-white mt-1">
                    {analyticsLoading ? "..." : totalClicks.toLocaleString()}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-pink-600/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                  <MousePointerClick className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Filter, Search, and Create Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by customer name or slug..."
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-900 border border-slate-800 p-1 rounded-2xl">
                  {(["all", "published", "draft"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                        filterStatus === st
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create Profile Button Beside Search */}
              <button
                onClick={handleCreateProfileClick}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md transition-all active:scale-95 flex-shrink-0 cursor-pointer ${
                  isTokensExhausted
                    ? "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30"
                }`}
              >
                {isTokensExhausted ? <Lock className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4" />}
                <span>Create Profile</span>
              </button>
            </div>

            {/* Profiles Table / Cards */}
            {loading ? (
              <div className="text-center py-20 text-slate-500 text-sm">
                Loading profiles...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-slate-800 bg-slate-900/30">
                <Smartphone className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No Profiles Found</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isAdmin && adminUserFilter !== "all"
                    ? "This user has no profiles yet."
                    : "Try adjusting your search criteria or create a brand new profile."}
                </p>
                <button
                  onClick={handleCreateProfileClick}
                  className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Profile</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((item) => {
                  const itemAnalytics = analytics[item.id];
                  return (
                    <div
                      key={item.id}
                      className="group relative flex flex-col justify-between rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 shadow-xl transition-all duration-300 hover:translate-y-[-2px]"
                    >
                      <div>
                        {/* Admin: Creator badge */}
                        {isAdmin && (
                          <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300">
                            <UserIcon className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                            <span className="truncate">
                              Create by: <strong className="text-white font-semibold">{getOwnerDisplayName(item.userId)}</strong>
                            </span>
                          </div>
                        )}

                        {/* Top Bar with Avatar & Status */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <LetterAvatar
                              name={item.name}
                              avatarUrl={item.avatarUrl}
                              className="w-12 h-12 text-sm"
                              shapeClass="rounded-2xl"
                              accentColor={item.themeSettings?.accentColor || "#8b5cf6"}
                              secondaryAccent={item.themeSettings?.secondaryAccent || "#06b6d4"}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-bold text-white truncate">
                                  {item.name}
                                </h3>
                                {item.verified && (
                                  <CheckCircle className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs font-mono text-purple-400 truncate">
                                /{item.slug}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              item.status === "published"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        {/* Subtitle / Bio Preview */}
                        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                          {item.bio || item.subtitle || "No description configured."}
                        </p>

                        {/* Template & Links Pill Stats */}
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400 mb-3">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800">
                            Layout: {item.templateId}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800">
                            {item.links.length} active channels
                          </span>
                        </div>

                        {/* Analytics Mini Stats */}
                        {itemAnalytics && (itemAnalytics.totalViews > 0 || itemAnalytics.totalClicks > 0) && (
                          <div className="flex items-center gap-3 mb-4 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Eye className="w-3 h-3 text-cyan-400" />
                              <span className="text-cyan-300 font-bold">{itemAnalytics.totalViews.toLocaleString()}</span>
                              <span className="text-slate-500">views</span>
                            </div>
                            <div className="w-px h-3 bg-slate-700" />
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <MousePointerClick className="w-3 h-3 text-pink-400" />
                              <span className="text-pink-300 font-bold">{itemAnalytics.totalClicks.toLocaleString()}</span>
                              <span className="text-slate-500">clicks</span>
                            </div>
                            {/* Top clicked link */}
                            {Object.keys(itemAnalytics.linkClicks || {}).length > 0 && (() => {
                              const topLinkId = Object.entries(itemAnalytics.linkClicks).sort(
                                ([, a], [, b]) => b - a
                              )[0]?.[0];
                              const topTitle = itemAnalytics.linkTitles?.[topLinkId];
                              const topCount = itemAnalytics.linkClicks[topLinkId];
                              if (topTitle) {
                                return (
                                  <>
                                    <div className="w-px h-3 bg-slate-700" />
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate">
                                      <TrendingUp className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                                      <span className="truncate">{topTitle}: {topCount}</span>
                                    </div>
                                  </>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-1">
                          {/* Visual Editor Button */}
                          <button
                            onClick={() => router.push(`/editor/${item.id}`)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Design</span>
                          </button>

                          {/* QR Code / Share Link */}
                          <button
                            onClick={() => setActiveQrProfile(item)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            title="Share Link & QR Code"
                          >
                            <QrCode className="w-4 h-4 text-purple-400" />
                          </button>

                          {/* Open in Live Tab */}
                          <a
                            href={`/${item.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            title="Open Profile Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>

                        {/* Duplicate & Delete Dropdown Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDuplicate(item.id)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                            title="Duplicate Profile"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* MENUS TAB */}
        {/* ============================================================ */}
        {activeTab === "menus" && (
          <>
            {/* Menu Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                    Total Menus
                  </p>
                  <h2 className="text-3xl font-extrabold text-white mt-1">
                    {menus.length}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
              </div>
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Published Menus
                  </p>
                  <h2 className="text-3xl font-extrabold text-white mt-1">
                    {menus.filter((m) => m.status === "published").length}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Globe className="w-6 h-6" />
                </div>
              </div>
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Draft Menus
                  </p>
                  <h2 className="text-3xl font-extrabold text-white mt-1">
                    {menus.filter((m) => m.status === "draft").length}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <FolderLock className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Search and Create Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by business name or slug..."
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Create Menu Button Beside Search */}
              <button
                onClick={handleCreateMenuClick}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md transition-all active:scale-95 flex-shrink-0 cursor-pointer ${
                  isTokensExhausted
                    ? "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
                    : "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-600/30"
                }`}
              >
                {isTokensExhausted ? <Lock className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4" />}
                <span>Create Menu</span>
              </button>
            </div>

            {/* Menu Cards */}
            {filteredMenus.length === 0 ? (
              <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-slate-800 bg-slate-900/30">
                <UtensilsCrossed className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No Menus Yet</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Create a digital menu for your restaurant, café, or any food business.
                </p>
                <button
                  onClick={handleCreateMenuClick}
                  className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Menu</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMenus.map((menu) => (
                  <div
                    key={menu.id}
                    className="group relative flex flex-col justify-between rounded-3xl bg-slate-900 border border-slate-800 hover:border-orange-500/30 p-5 shadow-xl transition-all duration-300 hover:translate-y-[-2px]"
                  >
                    <div>
                      {/* Admin: Creator badge */}
                      {isAdmin && (
                        <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300">
                          <UserIcon className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                          <span className="truncate">
                            Create by: <strong className="text-white font-semibold">{getOwnerDisplayName(menu.userId)}</strong>
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          {/* Menu Logo or Emoji */}
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold border"
                            style={{
                              backgroundColor: menu.themeSettings?.accentColor + "15",
                              borderColor: menu.themeSettings?.accentColor + "30",
                              color: menu.themeSettings?.accentColor || "#ea580c",
                            }}
                          >
                            {menu.logoUrl ? (
                              <img
                                src={menu.logoUrl}
                                alt={menu.businessName}
                                className="w-full h-full object-cover rounded-2xl"
                              />
                            ) : (
                              "🍽️"
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-white truncate">
                              {menu.businessName || "Untitled Menu"}
                            </h3>
                            <p className="text-xs font-mono text-orange-400 truncate">
                              /menu/{menu.slug || "..."}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            menu.status === "published"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {menu.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mb-3">
                        {menu.tagline || "No tagline set"}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400 mb-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800">
                          {menu.categories.length} categories
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800">
                          {menu.categories.reduce((sum, cat) => sum + cat.items.length, 0)} items
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/editor/menu/${menu.id}`)}
                          className="px-3 py-1.5 rounded-xl bg-orange-600/20 hover:bg-orange-600 text-orange-300 hover:text-white border border-orange-500/30 font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Menu</span>
                        </button>

                        {menu.slug && menu.status === "published" && (
                          <a
                            href={`/menu/${menu.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            title="Open Live Menu"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDuplicateMenu(menu.id)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                          title="Duplicate Menu"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenu(menu.id, menu.businessName)}
                          className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                          title="Delete Menu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {/* ============================================================ */}
        {/* MEMBERS MANAGEMENT TAB (Super Admin) */}
        {/* ============================================================ */}
        {activeTab === "members" && isAdmin && (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Clients</span>
                  <h2 className="text-2xl font-black text-white mt-0.5">{clientMembers.length}</h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className={`p-4 rounded-2xl border transition-all ${
                pendingCount > 0
                  ? "bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/10"
                  : "bg-slate-900 border-slate-800"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Pending Review</span>
                    <h2 className="text-2xl font-black text-amber-300 mt-0.5 flex items-center gap-2">
                      <span>{pendingCount}</span>
                      {pendingCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </h2>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Active Members</span>
                  <h2 className="text-2xl font-black text-white mt-0.5">{activeMembersCount}</h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Suspended</span>
                  <h2 className="text-2xl font-black text-white mt-0.5">{suspendedCount}</h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <UserX className="w-5 h-5" />
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">AI Scans Used</span>
                  <h2 className="text-2xl font-black text-white mt-0.5">{totalAiScansUsed}</h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filter Pills, Search Bar, and Add Account Button */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
                {(["all", "pending", "approved", "suspended"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setMemberFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      memberFilter === st
                        ? st === "pending"
                          ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                          : st === "approved"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : st === "suspended"
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {st === "approved" ? "Active" : st}
                    {st === "pending" && pendingCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px]">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search & Add Action */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search by business, email, phone, order #..."
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={() => setAddAccountModalOpen(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer flex-shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Client Account</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>

            {/* Members List */}
            {filteredMembers.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-800 bg-slate-900/30">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No Member Accounts Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {memberSearch
                    ? `No accounts match "${memberSearch}". Try adjusting your search query.`
                    : memberFilter === "pending"
                    ? "Great news! There are no pending account registrations waiting for review."
                    : "No client accounts have been registered under this filter."}
                </p>
                {memberFilter !== "all" && (
                  <button
                    onClick={() => setMemberFilter("all")}
                    className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                  >
                    View All Accounts
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredMembers.map((m) => {
                  const isSuperAdminAccount = isSuperAdminMember(m);
                  const memberProfiles = profiles.filter((p) => p.userId === m.uid);
                  const memberMenus = menus.filter((menu) => menu.userId === m.uid);
                  const memberViews = memberProfiles.reduce(
                    (sum, p) => sum + (analytics[p.id]?.totalViews || 0),
                    0
                  );

                  return (
                    <div
                      key={m.uid}
                      className={`relative rounded-3xl bg-slate-900 border p-5 shadow-xl transition-all duration-200 flex flex-col justify-between ${
                        m.status === "pending"
                          ? "border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-slate-900"
                          : m.status === "suspended"
                          ? "border-rose-500/30 opacity-75"
                          : "border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        {/* Top Row: Business Name & Status Badge */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-extrabold text-white text-base shadow-md flex-shrink-0">
                              {m.businessName?.charAt(0)?.toUpperCase() || "C"}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-extrabold text-white truncate flex items-center gap-1.5">
                                <span>{m.businessName || "Unnamed Business"}</span>
                                {isSuperAdminAccount && (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    Admin
                                  </span>
                                )}
                              </h3>
                              <p className="text-xs text-slate-400 font-mono truncate">{m.email}</p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          {m.status === "pending" ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 flex-shrink-0 animate-pulse">
                              <Clock className="w-3 h-3" />
                              <span>Pending</span>
                            </span>
                          ) : m.status === "approved" ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 flex-shrink-0">
                              <CheckCircle className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 flex-shrink-0">
                              <UserX className="w-3 h-3" />
                              <span>Suspended</span>
                            </span>
                          )}
                        </div>

                        {/* Metadata Details Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-3">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Order Ref #</span>
                            <span className="text-purple-300 font-semibold truncate block">
                              {m.orderRef || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Phone</span>
                            <span className="text-slate-300 font-mono truncate block">
                              {m.phone || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Registered</span>
                            <span className="text-slate-400 truncate block">
                              {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Created Items</span>
                            <span className="text-slate-300 font-bold block">
                              {memberProfiles.length} profiles • {memberMenus.length} menus
                            </span>
                          </div>
                        </div>

                        {/* Card Token Quota Bar */}
                        <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 mb-2.5">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-medium">
                              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                              <span>Card Tokens (1 Card = 1 Profile/Menu)</span>
                            </span>
                            <span className="text-xs font-mono font-bold text-white">
                              {isSuperAdminAccount ? "Unlimited (Admin)" : `${memberProfiles.length + memberMenus.length} / ${m.cardTokensLimit || 1}`}
                            </span>
                          </div>
                          {!isSuperAdminAccount && (
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  (memberProfiles.length + memberMenus.length) >= (m.cardTokensLimit || 1)
                                    ? "bg-rose-500"
                                    : "bg-gradient-to-r from-amber-500 to-orange-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (((memberProfiles.length + memberMenus.length) / (m.cardTokensLimit || 1)) * 100)
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* AI Token Quota Bar */}
                        <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 mb-4">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium">
                              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                              <span>AI Menu Scans Quota</span>
                            </span>
                            <span className="text-xs font-mono font-bold text-white">
                              {isSuperAdminAccount ? "Unlimited (Admin)" : `${m.aiScansUsed || 0} / ${m.aiScansLimit || 5}`}
                            </span>
                          </div>
                          {!isSuperAdminAccount && (
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  (m.aiScansUsed || 0) >= (m.aiScansLimit || 5)
                                    ? "bg-rose-500"
                                    : "bg-gradient-to-r from-cyan-500 to-purple-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (((m.aiScansUsed || 0) / (m.aiScansLimit || 5)) * 100)
                                  )}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Bar */}
                      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                        {/* Pending Account: 1-Click Approve or Reject */}
                        {m.status === "pending" ? (
                          <div className="flex items-center gap-2 w-full">
                            <button
                              onClick={() => handleApproveMember(m.uid)}
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>Approve Client Access</span>
                            </button>
                            <button
                              onClick={() => handleDeleteMember(m.uid, m.businessName)}
                              className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                              title="Reject & Delete Registration"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Approved / Suspended Account Actions */}
                            <div className="flex items-center flex-wrap gap-1.5">
                              {/* Manage Card Tokens */}
                              {!isSuperAdminAccount && (
                                <button
                                  onClick={() => {
                                    setSelectedMemberForTokens(m);
                                    setTokensInput(m.cardTokensLimit || 1);
                                    setTokensMsg(null);
                                    setTokensModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Manage or Top-Up Card Tokens for this Client"
                                >
                                  <CreditCard className="w-3 h-3 text-amber-400" />
                                  <span>Manage Cards ({m.cardTokensLimit || 1})</span>
                                </button>
                              )}

                              {/* Top Up AI Scans */}
                              {!isSuperAdminAccount && (
                                <button
                                  onClick={() => handleAddAiScans(m.uid)}
                                  className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
                                  title="Add +5 AI Scans to Member Quota"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>+5 AI Scans</span>
                                </button>
                              )}

                              {/* Inspect Profiles & Menus */}
                              <button
                                onClick={() => {
                                  setAdminUserFilter(m.uid);
                                  setActiveTab("profiles");
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="Filter dashboard profiles by this client"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Inspect ({memberProfiles.length})</span>
                              </button>
                            </div>

                            {/* Suspend or Reactivate / Delete */}
                            {!isSuperAdminAccount && (
                              <div className="flex items-center gap-1">
                                {m.status === "approved" ? (
                                  <button
                                    onClick={() => handleSuspendMember(m.uid)}
                                    className="px-2.5 py-1.5 rounded-xl text-amber-400 hover:bg-amber-500/10 text-[11px] font-semibold transition-colors"
                                  >
                                    Suspend
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReactivateMember(m.uid)}
                                    className="px-2.5 py-1.5 rounded-xl text-emerald-400 hover:bg-emerald-500/10 text-[11px] font-semibold transition-colors"
                                  >
                                    Reactivate
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDeleteMember(m.uid, m.businessName)}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                                  title="Delete Account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Super Admin: + Add Account Modal */}
      {addAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-slide-up">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Add Client Account</h3>
                  <p className="text-[11px] text-slate-400">Account will be immediately pre-approved</p>
                </div>
              </div>
              <button
                onClick={() => setAddAccountModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addAccountMsg && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
                  addAccountMsg.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                }`}
              >
                {addAccountMsg.type === "success" ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{addAccountMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleAddAccountSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Business / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={addAccountForm.businessName}
                  onChange={(e) =>
                    setAddAccountForm({ ...addAccountForm, businessName: e.target.value })
                  }
                  placeholder="e.g. Kaia Coffee House"
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Client Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={addAccountForm.email}
                  onChange={(e) => setAddAccountForm({ ...addAccountForm, email: e.target.value })}
                  placeholder="client@company.com"
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={addAccountForm.pass}
                  onChange={(e) => setAddAccountForm({ ...addAccountForm, pass: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={addAccountForm.phone}
                    onChange={(e) =>
                      setAddAccountForm({ ...addAccountForm, phone: e.target.value })
                    }
                    placeholder="0917 123 4567"
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Order Ref #</label>
                  <input
                    type="text"
                    value={addAccountForm.orderRef}
                    onChange={(e) =>
                      setAddAccountForm({ ...addAccountForm, orderRef: e.target.value })
                    }
                    placeholder="e.g. Order #1052"
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>NFC Card Tokens *</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    required
                    value={addAccountForm.cardTokensLimit}
                    onChange={(e) =>
                      setAddAccountForm({
                        ...addAccountForm,
                        cardTokensLimit: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">1 Card = 1 Profile/Menu</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>AI Scans Quota</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={addAccountForm.aiScansLimit}
                    onChange={(e) =>
                      setAddAccountForm({
                        ...addAccountForm,
                        aiScansLimit: parseInt(e.target.value) || 5,
                      })
                    }
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Free OCR scans</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddAccountModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addAccountLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {addAccountLoading ? "Creating..." : "Create & Pre-Approve"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Card Tokens Modal (Super Admin) */}
      {tokensModalOpen && selectedMemberForTokens && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Manage Card Tokens</h3>
                  <p className="text-[11px] text-slate-400">{selectedMemberForTokens.businessName}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setTokensModalOpen(false);
                  setSelectedMemberForTokens(null);
                  setTokensMsg(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {tokensMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  tokensMsg.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                }`}
              >
                {tokensMsg.type === "success" ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{tokensMsg.text}</span>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Total Cards/Tokens:</span>
                <span className="font-mono font-bold text-amber-300 text-sm">
                  {selectedMemberForTokens.cardTokensLimit || 1} Cards
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Slot Cost:</span>
                <span className="text-slate-300 font-semibold">1 Card = 1 Profile or 1 Menu</span>
              </div>
            </div>

            {/* Quick Top-Up Cards (When client reorders cards) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Quick Top-Up (Client Re-Ordered Cards)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={tokensLoading}
                    onClick={() => handleSaveMemberTokens("add", num)}
                    className="py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+{num} Card{num > 1 ? "s" : ""}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Total Adjustment */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Or Set Exact Total Card Allowance
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={tokensInput}
                  onChange={(e) => setTokensInput(parseInt(e.target.value) || 1)}
                  className="flex-1 text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  type="button"
                  disabled={tokensLoading}
                  onClick={() => handleSaveMemberTokens("set", tokensInput)}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/30 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {tokensLoading ? "Saving..." : "Update Total"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal for Selected Profile */}
      {activeQrProfile && (
        <QRCodeModal
          profile={activeQrProfile}
          isOpen={Boolean(activeQrProfile)}
          onClose={() => setActiveQrProfile(null)}
        />
      )}
    </div>
  );
}

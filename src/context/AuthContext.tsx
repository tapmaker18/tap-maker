"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  UserCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { MemberAccount, UserRole } from "@/lib/types";
import { getMemberAccount, saveMemberAccount, createDefaultAdminAccount } from "@/lib/userStorage";
import { isSuperAdminEmail, SUPER_ADMIN_ROLE } from "@/lib/admin";

interface AuthContextType {
  user: User | null;
  memberAccount: MemberAccount | null;
  loading: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  isSuperAdminCandidate: boolean;
  adminSetupRequired: boolean;
  isApproved: boolean;
  isPending: boolean;
  isSuspended: boolean;
  signIn: (email: string, pass: string) => Promise<UserCredential>;
  signUp: (email: string, pass: string, metadata?: { businessName: string; phone?: string; orderRef?: string }) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  refreshMemberAccount: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  memberAccount: null,
  loading: true,
  role: null,
  isAdmin: false,
  isSuperAdminCandidate: false,
  adminSetupRequired: false,
  isApproved: false,
  isPending: false,
  isSuspended: false,
  signIn: async () => {
    throw new Error("AuthProvider not mounted");
  },
  signUp: async () => {
    throw new Error("AuthProvider not mounted");
  },
  signOut: async () => {},
  refreshMemberAccount: async () => {},
  sendVerificationEmail: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [memberAccount, setMemberAccount] = useState<MemberAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [adminSetupRequired, setAdminSetupRequired] = useState(false);

  const resolveAdminStatus = useCallback(async (firebaseUser: User): Promise<boolean> => {
    try {
      let tokenResult = await firebaseUser.getIdTokenResult();
      // The verified owner can bootstrap the immutable custom claim and keep
      // the non-authoritative member record in sync on every login.
      if (isSuperAdminEmail(firebaseUser.email) && firebaseUser.emailVerified) {
        const response = await fetch("/api/admin/bootstrap", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${await firebaseUser.getIdToken()}`,
          },
        });
        if (response.ok) {
          await firebaseUser.getIdToken(true);
          tokenResult = await firebaseUser.getIdTokenResult();
          const hasAdminClaim = tokenResult.claims.role === SUPER_ADMIN_ROLE;
          setIsAdmin(hasAdminClaim);
          setRole(hasAdminClaim ? SUPER_ADMIN_ROLE : null);
          setAdminSetupRequired(!hasAdminClaim);
          return hasAdminClaim;
        }
        setAdminSetupRequired(true);
      }

      if (tokenResult.claims.role === SUPER_ADMIN_ROLE) {
        setIsAdmin(true);
        setRole(SUPER_ADMIN_ROLE);
        setAdminSetupRequired(false);
        return true;
      }
    } catch (err) {
      console.warn("Unable to resolve Super Admin claim:", err);
    }

    setIsAdmin(false);
    setRole(null);
    return false;
  }, []);

  const fetchAccount = useCallback(async (firebaseUser: User | null, hasAdminAccess = false) => {
    if (!firebaseUser) {
      setMemberAccount(null);
      return;
    }

    const email = firebaseUser.email || "";
    if (hasAdminAccess) {
      const adminAcc = createDefaultAdminAccount(firebaseUser.uid);
      setMemberAccount(adminAcc);
      return;
    }

    try {
      let acc = await getMemberAccount(firebaseUser.uid, email);
      if (!acc) {
        // First-time fallback initialization
        acc = {
          uid: firebaseUser.uid,
          email,
          businessName: firebaseUser.displayName || "Client Account",
          status: "pending",
          role: "member",
          aiScansLimit: 5,
          aiScansUsed: 0,
          createdAt: new Date().toISOString(),
        };
        await saveMemberAccount(acc);
      }
      setMemberAccount(acc);
    } catch (err) {
      console.warn("Error fetching member account:", err);
    }
  }, []);

  const refreshMemberAccount = useCallback(async () => {
    if (user) {
      await fetchAccount(user, isAdmin);
    }
  }, [user, isAdmin, fetchAccount]);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);
      if (currentUser) {
        const hasAdminAccess = await resolveAdminStatus(currentUser);
        await fetchAccount(currentUser, hasAdminAccess);
      } else {
        setMemberAccount(null);
        setIsAdmin(false);
        setRole(null);
        setAdminSetupRequired(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchAccount, resolveAdminStatus]);

  const signIn = async (email: string, pass: string): Promise<UserCredential> => {
    if (!auth) throw new Error("Firebase Auth is not initialized");
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const hasAdminAccess = await resolveAdminStatus(cred.user);
    await fetchAccount(cred.user, hasAdminAccess);
    return cred;
  };

  const signUp = async (
    email: string,
    pass: string,
    metadata?: { businessName: string; phone?: string; orderRef?: string }
  ): Promise<UserCredential> => {
    if (!auth) throw new Error("Firebase Auth is not initialized");
    const cred = await createUserWithEmailAndPassword(auth, email, pass);

    // Public sign-up always creates a pending member. Admin access can only be
    // granted by a Firebase custom claim on the server.
    const newAccount: MemberAccount = {
      uid: cred.user.uid,
      email: cred.user.email || email.trim(),
      businessName: metadata?.businessName?.trim() || "New Client",
      phone: metadata?.phone?.trim() || "",
      orderRef: metadata?.orderRef?.trim() || "",
      status: "pending",
      role: "member",
      aiScansLimit: 5,
      aiScansUsed: 0,
      createdAt: new Date().toISOString(),
      approvedAt: null,
    };

    await saveMemberAccount(newAccount);
    await sendEmailVerification(cred.user).catch((err) => {
      console.warn("Unable to send verification email:", err);
    });
    setMemberAccount(newAccount);
    return cred;
  };

  const signOut = async (): Promise<void> => {
    if (auth) {
      await firebaseSignOut(auth);
    }
    setUser(null);
    setMemberAccount(null);
    setIsAdmin(false);
    setRole(null);
    setAdminSetupRequired(false);
  };

  const sendVerificationEmail = async (): Promise<void> => {
    if (!user) throw new Error("Please sign in first.");
    await sendEmailVerification(user);
  };

  const isApproved = isAdmin || memberAccount?.status === "approved";
  const isPending = !isAdmin && (!memberAccount || memberAccount.status === "pending");
  const isSuspended = !isAdmin && memberAccount?.status === "suspended";

  return (
    <AuthContext.Provider
      value={{
        user,
        memberAccount,
        loading,
        role: isAdmin ? SUPER_ADMIN_ROLE : role || memberAccount?.role || null,
        isAdmin,
        isSuperAdminCandidate: isSuperAdminEmail(user?.email),
        adminSetupRequired,
        isApproved,
        isPending,
        isSuspended,
        signIn,
        signUp,
        signOut,
        refreshMemberAccount,
        sendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

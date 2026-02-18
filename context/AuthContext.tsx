"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/* ─── Types ─── */

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "customer" | "business_owner" | "admin";
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isBusinessOwner: boolean;
}

/* ─── Context ─── */

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  isBusinessOwner: false,
});

/* ─── Provider ─── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch Firestore profile for role info
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          }
        } catch {
          // Profile may not exist yet — that's fine
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsub;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isBusinessOwner: profile?.role === "business_owner",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ─── Hook ─── */

export function useAuth() {
  return useContext(AuthContext);
}

"use client";

/**
 * Silent background component — mounts in layout.tsx.
 * Watches Firebase auth state and keeps CometChat session in sync.
 */

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { loginCometChat, logoutCometChat } from "@/lib/cometchat";

export default function ChatBootstrap() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      logoutCometChat();
      return;
    }
    const name = profile?.displayName ?? user.email ?? user.uid;
    loginCometChat(user.uid, name).catch(console.error);
  }, [user, profile, loading]);

  return null; // renders nothing — purely side-effects
}

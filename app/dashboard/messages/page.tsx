"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import "@cometchat/chat-uikit-react/css-variables.css";
import "@/app/cometchat-styles.css";
import { AppContextProvider } from "@/context/cometchat/AppContext";
import { CometChatProvider } from "@/context/cometchat/CometChatContext";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { initCometChat } from "@/lib/cometchat";

const CometChatHome = dynamic(
  () => import("@/components/cometchat/CometChatHome").then((m) => m.CometChatHome),
  { ssr: false }
);

function MessagesContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");

  const [defaultUser, setDefaultUser] = useState<CometChat.User | undefined>();
  const [ready, setReady] = useState(!uid); // if no uid, we're immediately ready

  useEffect(() => {
    if (!uid) return;
    // Wait for SDK init + login, then fetch the target user
    initCometChat().then(() =>
      CometChat.getUser(uid)
        .then((user) => setDefaultUser(user))
        .catch(() => {})
        .finally(() => setReady(true))
    );
  }, [uid]);

  return (
    <AppContextProvider>
      <CometChatProvider>
        <div style={{ height: "100dvh", width: "100vw", overflow: "hidden" }}>
          {ready && <CometChatHome defaultUser={defaultUser} />}
        </div>
      </CometChatProvider>
    </AppContextProvider>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesContent />
    </Suspense>
  );
}

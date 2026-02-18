"use client";

import dynamic from "next/dynamic";
import "@cometchat/chat-uikit-react/css-variables.css";
import "@/app/cometchat-styles.css";
import { AppContextProvider } from "@/context/cometchat/AppContext";
import { CometChatProvider } from "@/context/cometchat/CometChatContext";

const CometChatHome = dynamic(
  () => import("@/components/cometchat/CometChatHome").then((m) => m.CometChatHome),
  { ssr: false }
);

export default function MessagesPage() {
  return (
    <AppContextProvider>
      <CometChatProvider>
        <div style={{ height: "100dvh", width: "100vw", overflow: "hidden" }}>
          <CometChatHome />
        </div>
      </CometChatProvider>
    </AppContextProvider>
  );
}

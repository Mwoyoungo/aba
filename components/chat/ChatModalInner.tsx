"use client";

/**
 * Loaded dynamically (ssr: false) — uses browser-only CometChat APIs.
 * Opens a 1-on-1 chat with a specific business owner.
 */

import { useEffect, useState } from "react";
import {
  CometChatMessageHeader,
  CometChatMessageList,
  CometChatMessageComposer,
} from "@cometchat/chat-uikit-react";
import { CometChat } from "@cometchat/chat-sdk-javascript";

interface Props {
  targetUid: string;
  targetName: string;
  onClose: () => void;
}

export default function ChatModalInner({ targetUid, targetName, onClose }: Props) {
  const [chatUser, setChatUser] = useState<CometChat.User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    CometChat.getUser(targetUid)
      .then(setChatUser)
      .catch(() => setError("Could not load chat. Please try again."));
  }, [targetUid]);

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="relative w-full sm:w-[420px] h-[85dvh] sm:h-[640px] bg-[#0f0f0f] border border-white/10 sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 size-8 rounded-full bg-black/40 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Chat area */}
        {error ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <span className="material-symbols-outlined text-4xl text-white/20">chat_error</span>
            <p className="text-white/40 text-sm">{error}</p>
          </div>
        ) : !chatUser ? (
          <div className="flex items-center justify-center h-full">
            <span className="size-7 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
            {/* CometChat message header */}
            <CometChatMessageHeader
              user={chatUser}
              hideVideoCallButton
              hideVoiceCallButton
            />
            {/* Message list */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <CometChatMessageList user={chatUser} />
            </div>
            {/* Composer */}
            <CometChatMessageComposer user={chatUser} />
          </div>
        )}
      </div>
    </div>
  );
}

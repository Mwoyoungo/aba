"use client";

/**
 * Loaded dynamically (ssr: false).
 * Full conversations + messages inbox for the business owner dashboard.
 * Composes CometChatConversations + message panel manually (v6 UIKit).
 */

import { useState } from "react";
import {
  CometChatConversations,
  CometChatMessageHeader,
  CometChatMessageList,
  CometChatMessageComposer,
} from "@cometchat/chat-uikit-react";
import { CometChat } from "@cometchat/chat-sdk-javascript";

export default function ChatInboxInner() {
  const [selectedUser, setSelectedUser] = useState<CometChat.User | null>(null);

  const handleConversationClick = (conversation: CometChat.Conversation) => {
    const target = conversation.getConversationWith();
    if (target instanceof CometChat.User) {
      setSelectedUser(target);
    }
  };

  return (
    <div style={{ display: "flex", height: "580px", width: "100%", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>

      {/* Conversations list */}
      <div style={{ width: "300px", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        <CometChatConversations
          onItemClick={handleConversationClick}
          hideDeleteConversation
        />
      </div>

      {/* Message panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {selectedUser ? (
          <>
            <CometChatMessageHeader
              user={selectedUser}
              hideVideoCallButton
              hideVoiceCallButton
              onBack={() => setSelectedUser(null)}
            />
            <div style={{ flex: 1, overflow: "hidden" }}>
              <CometChatMessageList user={selectedUser} />
            </div>
            <CometChatMessageComposer user={selectedUser} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#0d0d0d]">
            <span className="material-symbols-outlined text-5xl text-white/10">forum</span>
            <p className="text-white/30 text-sm">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}

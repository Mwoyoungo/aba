"use client";

/**
 * Full-page CometChat UI Kit — conversations sidebar + message panel.
 * Loaded via dynamic import (ssr: false) from ChatPage.tsx.
 */

import { useState } from "react";
import {
  CometChatConversations,
  CometChatMessageHeader,
  CometChatMessageList,
  CometChatMessageComposer,
} from "@cometchat/chat-uikit-react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import Link from "next/link";

export default function ChatPageInner() {
  const [selectedUser, setSelectedUser] = useState<CometChat.User | null>(null);

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100dvh - 72px)",
        width: "100%",
        overflow: "hidden",
        background: "#0a0a0a",
      }}
    >
      {/* ── Conversations sidebar ── */}
      <div
        style={{
          width: "340px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            padding: "20px 20px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href="/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.6)",
                textDecoration: "none",
                fontSize: "18px",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
            </Link>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>Messages</span>
          </div>
        </div>

        {/* Conversations list — fills remaining height */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <CometChatConversations
            onItemClick={(conversation: CometChat.Conversation) => {
              const target = conversation.getConversationWith();
              if (target instanceof CometChat.User) {
                setSelectedUser(target);
              }
            }}
            hideDeleteConversation
          />
        </div>
      </div>

      {/* ── Message panel ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
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
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              background: "#0d0d0d",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "36px", color: "rgba(255,255,255,0.12)" }}
              >
                forum
              </span>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px", fontWeight: 500 }}>
                No conversation selected
              </p>
              <p style={{ color: "rgba(255,255,255,0.18)", fontSize: "12px", marginTop: "4px" }}>
                Pick a chat from the sidebar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

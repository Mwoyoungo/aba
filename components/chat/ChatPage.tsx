"use client";

import dynamic from "next/dynamic";

const ChatPageInner = dynamic(() => import("./ChatPageInner"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "calc(100dvh - 72px)",
        background: "#0a0a0a",
      }}
    >
      <span
        style={{
          display: "block",
          width: "32px",
          height: "32px",
          border: "3px solid rgba(255,255,255,0.08)",
          borderTopColor: "#cdfa47",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
    </div>
  ),
});

export default function ChatPage() {
  return <ChatPageInner />;
}

"use client";

import dynamic from "next/dynamic";

const ChatInboxInner = dynamic(() => import("./ChatInboxInner"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-[#161811] rounded-2xl flex items-center justify-center">
      <span className="size-8 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
    </div>
  ),
});

export default function ChatInbox() {
  return <ChatInboxInner />;
}

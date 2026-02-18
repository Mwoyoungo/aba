"use client";

import dynamic from "next/dynamic";

const ChatBootstrap = dynamic(() => import("./ChatBootstrap"), { ssr: false });

export default function ChatBootstrapLoader() {
  return <ChatBootstrap />;
}

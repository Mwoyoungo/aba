"use client";

/**
 * Public-facing wrapper — dynamically imports the CometChat component
 * so it never runs on the server.
 */

import dynamic from "next/dynamic";

const ChatModalInner = dynamic(() => import("./ChatModalInner"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <span className="size-8 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
    </div>
  ),
});

interface Props {
  isOpen: boolean;
  targetUid: string;
  targetName: string;
  onClose: () => void;
}

export default function ChatModal({ isOpen, targetUid, targetName, onClose }: Props) {
  if (!isOpen) return null;
  return <ChatModalInner targetUid={targetUid} targetName={targetName} onClose={onClose} />;
}

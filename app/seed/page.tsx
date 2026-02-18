"use client";

import { useState } from "react";
import Link from "next/link";
import { seedBusinesses } from "@/lib/seed";

type Status = "idle" | "loading" | "done" | "error";

export default function SeedPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSeed = async () => {
    setStatus("loading");
    setMessage("");
    try {
      const result = await seedBusinesses();
      setStatus("done");
      setMessage(`Successfully seeded ${result.seeded} businesses into Firestore.`);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-[#161811] border border-[#353a27]/50 rounded-3xl p-10 max-w-md w-full text-center space-y-6">
        <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto">
          <span className="material-symbols-outlined text-3xl">database</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Seed Firestore</h1>
          <p className="text-white/40 text-sm">
            Populates the database with 8 sample South African businesses
            including real coordinates for proximity testing.
          </p>
        </div>

        {status === "idle" && (
          <button
            onClick={handleSeed}
            className="w-full py-4 bg-primary text-[#0a0a0a] font-bold rounded-full hover:brightness-110 transition-all"
          >
            Seed Businesses
          </button>
        )}

        {status === "loading" && (
          <div className="flex items-center justify-center gap-3 text-white/60">
            <span className="size-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="size-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="size-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
            <span className="text-sm">Writing to Firestore...</span>
          </div>
        )}

        {status === "done" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-center text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <span className="font-bold">{message}</span>
            </div>
            <Link
              href="/"
              className="block w-full py-4 bg-primary text-[#0a0a0a] font-bold rounded-full hover:brightness-110 transition-all"
            >
              Go to Home Page
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-left">
              <p className="text-red-400 text-xs font-mono break-all">{message}</p>
            </div>
            <p className="text-white/40 text-xs">
              Make sure Firestore rules allow writes:{" "}
              <code className="text-primary">allow read, write: if true;</code>
            </p>
            <button
              onClick={handleSeed}
              className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        <p className="text-white/20 text-xs">Dev tool — remove before going live</p>
      </div>
    </div>
  );
}

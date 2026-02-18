"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (location) params.set("loc", location);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="mt-10 w-full max-w-3xl mx-auto">
      <form
        onSubmit={handleSearch}
        className="flex flex-col md:flex-row items-stretch md:items-center gap-2 p-2 bg-[#161811] border border-[#353a27]/50 rounded-2xl md:rounded-full shadow-2xl focus-within:border-primary/50 transition-all duration-300"
      >
        {/* Keyword input */}
        <div className="flex flex-1 items-center px-4">
          <span className="material-symbols-outlined text-white/40 mr-3 shrink-0">search</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you looking for? (Legal, Finance, Design...)"
            className="w-full bg-transparent border-none outline-none focus:ring-0 text-white placeholder:text-white/30 py-4 text-sm md:text-base"
          />
        </div>

        {/* Divider */}
        <div className="hidden md:block h-8 w-px bg-[#353a27]/50" />

        {/* Location input */}
        <div className="flex items-center px-4">
          <span className="material-symbols-outlined text-white/40 mr-3 shrink-0">location_on</span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="w-full md:w-36 bg-transparent border-none outline-none focus:ring-0 text-white placeholder:text-white/30 py-4 text-sm md:text-base"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="px-8 py-4 bg-primary text-[#0a0a0a] rounded-xl md:rounded-full font-bold text-base hover:scale-[1.02] active:scale-95 transition-transform shadow-lg shadow-primary/10"
        >
          Search
        </button>
      </form>

      {/* Popular tags */}
      <div className="flex flex-wrap justify-center items-center gap-4 mt-6 text-white/40 text-sm font-medium">
        <span>Popular:</span>
        {["Legal Counsel", "Wealth Management", "Architects", "Fine Dining"].map((tag) => (
          <button
            key={tag}
            onClick={() => setQuery(tag)}
            className="hover:text-primary transition-colors underline decoration-primary/30 underline-offset-4"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

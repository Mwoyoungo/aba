"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getBusinesses, type Business } from "@/lib/firestore";
import { getUserLocation, formatDistance, type Coordinates } from "@/lib/geo";

/* ─── Category filters ─── */

const CATEGORIES = [
  { id: "", label: "All" },
  { id: "legal", label: "Legal" },
  { id: "finance", label: "Finance" },
  { id: "creative", label: "Creative" },
  { id: "health", label: "Health" },
  { id: "real-estate", label: "Real Estate" },
  { id: "technology", label: "Technology" },
  { id: "education", label: "Education" },
  { id: "hospitality", label: "Hospitality" },
  { id: "construction", label: "Construction" },
  { id: "retail", label: "Retail" },
];

/* ─── Business card ─── */

function BusinessCard({ biz }: { biz: Business }) {
  return (
    <Link href={`/business/${biz.id}`} className="group block">
      <div className="bg-[#161811] border border-[#353a27]/30 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        {/* Image */}
        <div className="relative h-44 bg-[#0d0d0d]">
          {biz.images[0] ? (
            <Image
              src={biz.images[0]}
              alt={biz.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-white/5">business</span>
            </div>
          )}
          {/* Distance badge */}
          {biz.distanceKm != null && (
            <div className="absolute top-3 left-3 bg-[#0a0a0a]/80 backdrop-blur-sm text-primary text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">near_me</span>
              {formatDistance(biz.distanceKm)}
            </div>
          )}
          {/* Featured badge */}
          {biz.isFeatured && (
            <div className="absolute top-3 right-3 bg-primary text-[#0a0a0a] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Featured
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-white font-bold text-sm group-hover:text-primary transition-colors leading-snug">
              {biz.name}
            </h3>
            {biz.isVerified && (
              <span
                className="material-symbols-outlined text-primary text-base shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            )}
          </div>
          <p className="text-primary/80 text-xs font-semibold uppercase tracking-wider mb-2">
            {biz.category}
          </p>
          <p className="text-white/40 text-xs leading-relaxed line-clamp-2 mb-3">
            {biz.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span
                className="material-symbols-outlined text-primary text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              <span className="text-white text-xs font-bold">{biz.rating.toFixed(1)}</span>
              <span className="text-white/30 text-xs">({biz.reviewCount})</span>
            </div>
            <div className="flex items-center gap-1 text-white/30 text-xs">
              <span className="material-symbols-outlined text-xs">location_on</span>
              {biz.city}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Skeleton card ─── */

function CardSkeleton() {
  return (
    <div className="bg-[#161811] border border-[#353a27]/30 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-44 bg-white/5" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-5/6" />
      </div>
    </div>
  );
}

/* ─── Main search results component ─── */

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const q = searchParams.get("q") ?? "";
  const loc = searchParams.get("loc") ?? "";
  const categoryParam = searchParams.get("category") ?? "";

  const [results, setResults] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<"detecting" | "found" | "denied">("detecting");
  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [searchQuery, setSearchQuery] = useState(q);
  const [inputValue, setInputValue] = useState(q);

  /* Detect user location */
  useEffect(() => {
    getUserLocation()
      .then((coords) => {
        setUserCoords(coords);
        setLocationStatus("found");
      })
      .catch(() => setLocationStatus("denied"));
  }, []);

  /* Fetch results whenever query or category changes */
  const fetchResults = useCallback(() => {
    setLoading(true);
    getBusinesses({
      searchQuery: searchQuery || undefined,
      categoryId: activeCategory || undefined,
      userCoords: userCoords ?? undefined,
    })
      .then(setResults)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchQuery, activeCategory, userCoords]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  /* Re-fetch when userCoords arrives (adds distance sorting) */
  useEffect(() => {
    if (userCoords) fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCoords]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(inputValue);
    const params = new URLSearchParams();
    if (inputValue) params.set("q", inputValue);
    if (activeCategory) params.set("category", activeCategory);
    if (loc) params.set("loc", loc);
    router.replace(`/search?${params.toString()}`);
  };

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (catId) params.set("category", catId);
    if (loc) params.set("loc", loc);
    router.replace(`/search?${params.toString()}`);
  };

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16 min-h-screen">

        {/* ── Search bar ── */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-[#161811] border border-[#353a27]/50 rounded-2xl sm:rounded-full mb-8 focus-within:border-primary/50 transition-all"
        >
          <div className="flex flex-1 items-center px-4">
            <span className="material-symbols-outlined text-white/40 mr-3 shrink-0">search</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Business name, category, keyword..."
              className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/30 py-3 text-sm"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => { setInputValue(""); setSearchQuery(""); }}
                className="text-white/30 hover:text-white/60 transition-colors ml-2"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-primary text-[#0a0a0a] rounded-xl sm:rounded-full font-bold text-sm hover:brightness-110 transition-all"
          >
            Search
          </button>
        </form>

        {/* ── Category filter pills ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                activeCategory === cat.id
                  ? "bg-primary text-[#0a0a0a] border-primary"
                  : "bg-white/5 text-white/60 border-white/10 hover:border-primary/40 hover:text-primary"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── Status bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            {loading ? (
              <span className="text-white/40 text-sm">Searching...</span>
            ) : (
              <span className="text-white/60 text-sm">
                <span className="text-white font-bold">{results.length}</span> result{results.length !== 1 ? "s" : ""}
                {searchQuery && (
                  <span className="text-white/40"> for &ldquo;<span className="text-primary">{searchQuery}</span>&rdquo;</span>
                )}
                {activeCategory && (
                  <span className="text-white/40"> in <span className="text-primary">{CATEGORIES.find(c => c.id === activeCategory)?.label}</span></span>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {locationStatus === "detecting" && (
              <span className="flex items-center gap-1.5 text-white/30">
                <span className="size-1.5 bg-white/30 rounded-full animate-pulse" />
                Detecting location...
              </span>
            )}
            {locationStatus === "found" && (
              <span className="flex items-center gap-1.5 text-primary font-medium">
                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>near_me</span>
                Sorted by distance
              </span>
            )}
            {locationStatus === "denied" && (
              <span className="flex items-center gap-1.5 text-white/30">
                <span className="material-symbols-outlined text-xs">location_off</span>
                Location unavailable
              </span>
            )}
          </div>
        </div>

        {/* ── Results grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {results.map((biz) => (
              <BusinessCard key={biz.id} biz={biz} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="size-20 bg-white/5 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-white/20">search_off</span>
            </div>
            <p className="text-white font-semibold text-lg">No results found</p>
            <p className="text-white/40 text-sm text-center max-w-xs">
              Try a different keyword or category, or browse all listings below.
            </p>
            <button
              onClick={() => { setInputValue(""); setSearchQuery(""); setActiveCategory(""); router.replace("/search"); }}
              className="mt-2 px-6 py-2.5 bg-primary text-[#0a0a0a] rounded-full font-bold text-sm hover:brightness-110 transition-all"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

/* ─── Page wrapper with Suspense (required for useSearchParams) ─── */

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="size-8 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}

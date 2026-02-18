"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { getBusinesses, type Business } from "@/lib/firestore";
import { getUserLocation, formatDistance, type Coordinates } from "@/lib/geo";

type LocationState =
  | { status: "idle" }
  | { status: "detecting" }
  | { status: "found"; coords: Coordinates; label: string }
  | { status: "denied" };

interface BusinessListProps {
  /** If provided by SearchBar/URL params, filter to a category */
  categoryId?: string;
  searchQuery?: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex text-primary">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className="material-symbols-outlined text-sm"
          style={{ fontVariationSettings: rating >= star ? "'FILL' 1" : "'FILL' 0" }}
        >
          {rating >= star ? "star" : rating >= star - 0.5 ? "star_half" : "star"}
        </span>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[#161811] border border-[#353a27]/30 rounded-3xl overflow-hidden animate-pulse">
      <div className="h-52 bg-white/5" />
      <div className="p-6 space-y-3">
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="h-5 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-5/6" />
      </div>
    </div>
  );
}

export default function BusinessList({ categoryId, searchQuery }: BusinessListProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<LocationState>({ status: "idle" });

  const fetchBusinesses = useCallback(
    async (coords?: Coordinates) => {
      setLoading(true);
      try {
        const results = await getBusinesses({
          categoryId,
          searchQuery,
          userCoords: coords,
          radiusKm: coords ? 200 : undefined, // 200 km radius when location known
          limitCount: 12,
        });
        setBusinesses(results);
      } catch (err) {
        console.error("Failed to fetch businesses:", err);
      } finally {
        setLoading(false);
      }
    },
    [categoryId, searchQuery]
  );

  /** Auto-detect location on mount */
  useEffect(() => {
    setLocation({ status: "detecting" });
    getUserLocation()
      .then((coords) => {
        setLocation({ status: "found", coords, label: "your location" });
        fetchBusinesses(coords);
      })
      .catch(() => {
        // Permission denied or not supported — fetch without location
        setLocation({ status: "denied" });
        fetchBusinesses();
      });
  }, [fetchBusinesses]);

  const handleDetectLocation = () => {
    setLocation({ status: "detecting" });
    getUserLocation()
      .then((coords) => {
        setLocation({ status: "found", coords, label: "your location" });
        fetchBusinesses(coords);
      })
      .catch(() => {
        setLocation({ status: "denied" });
      });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            {location.status === "found"
              ? "Businesses Near You"
              : "Featured Businesses"}
          </h2>

          {/* Location status pill */}
          <div className="flex items-center gap-2">
            {location.status === "detecting" && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="size-2 bg-primary rounded-full animate-pulse" />
                Detecting your location...
              </div>
            )}
            {location.status === "found" && (
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <span className="material-symbols-outlined text-sm">near_me</span>
                Sorted by distance from your location
              </div>
            )}
            {location.status === "denied" && (
              <button
                onClick={handleDetectLocation}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-sm">location_off</span>
                Enable location for nearby results
              </button>
            )}
            {location.status === "idle" && (
              <p className="text-white/50 text-sm">
                The most sought-after verified businesses.
              </p>
            )}
          </div>
        </div>

        <Link
          href="/search"
          className="flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all shrink-0"
        >
          View All
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : businesses.map((biz) => (
              <Link
                key={biz.id}
                href={`/business/${biz.id}`}
                className="group bg-[#161811] border border-[#353a27]/30 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 flex flex-col"
              >
                {/* Image */}
                <div className="h-52 relative overflow-hidden">
                  {biz.images[0] ? (
                    <Image
                      src={biz.images[0]}
                      alt={biz.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#353a27]/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-white/10">
                        business
                      </span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {biz.isFeatured && (
                      <span className="bg-primary text-[#0a0a0a] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Featured
                      </span>
                    )}
                    {biz.isRemote && (
                      <span className="bg-white/10 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Remote
                      </span>
                    )}
                  </div>

                  {/* Distance badge — only when location is known */}
                  {location.status === "found" && biz.distanceKm != null && (
                    <div className="absolute bottom-3 right-3 bg-[#0a0a0a]/80 backdrop-blur-sm text-primary px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">near_me</span>
                      {formatDistance(biz.distanceKm)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={biz.rating} />
                    <span className="text-white text-xs font-medium">
                      {biz.rating.toFixed(1)}{" "}
                      <span className="text-white/40">({biz.reviewCount})</span>
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">
                    {biz.name}
                  </h3>

                  <p className="text-white/50 text-sm mb-4 line-clamp-2 flex-1">
                    {biz.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-[#353a27]/30 mt-auto">
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {biz.city}
                      </span>
                      {biz.isVerified && (
                        <span className="flex items-center gap-1 text-primary">
                          <span
                            className="material-symbols-outlined text-sm"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            verified
                          </span>
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="size-8 rounded-full border border-[#353a27]/50 flex items-center justify-center text-white/40 group-hover:bg-primary group-hover:border-primary group-hover:text-[#0a0a0a] transition-all duration-200">
                      <span className="material-symbols-outlined text-sm">arrow_outward</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
      </div>

      {/* Empty state */}
      {!loading && businesses.length === 0 && (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-white/10 mb-4 block">
            search_off
          </span>
          <p className="text-white/40 text-lg font-medium">No businesses found</p>
          <p className="text-white/25 text-sm mt-2">Try expanding your search or location</p>
        </div>
      )}
    </section>
  );
}

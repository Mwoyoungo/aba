"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getBusinessById, getSimilarBusinesses, type Business } from "@/lib/firestore";
import { getUserLocation, formatDistance, type Coordinates } from "@/lib/geo";
import { staticMapUrl, googleMapsUrl } from "@/lib/maps";
import { useAuth } from "@/context/AuthContext";

/* ─── Helpers ─── */

function StarRating({ rating, size = "base" }: { rating: number; size?: "sm" | "base" }) {
  const cls = `material-symbols-outlined ${size === "sm" ? "text-sm" : "text-base"}`;
  return (
    <div className="flex text-primary">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={cls}
          style={{ fontVariationSettings: rating >= star ? "'FILL' 1" : "'FILL' 0" }}
        >
          {rating >= star ? "star" : rating >= star - 0.5 ? "star_half" : "star"}
        </span>
      ))}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-white/5 rounded-xl animate-pulse ${className}`} />;
}

/* ─── Page ─── */

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [similar, setSimilar] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [notFound, setNotFound] = useState(false);

  /* Fetch user location (for distance display) */
  useEffect(() => {
    getUserLocation()
      .then(setUserCoords)
      .catch(() => null);
  }, []);

  /* Fetch business data */
  useEffect(() => {
    if (!id) return;

    setLoading(true);
    getBusinessById(id)
      .then(async (biz) => {
        if (!biz) {
          setNotFound(true);
          return;
        }
        setBusiness(biz);

        const sim = await getSimilarBusinesses(
          biz.id,
          biz.categoryId,
          userCoords ?? undefined
        );
        setSimilar(sim);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ── Not found ── */
  if (notFound) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <span className="material-symbols-outlined text-6xl text-white/10">business_off</span>
          <p className="text-white/50 text-xl">Business not found.</p>
          <Link href="/" className="text-primary font-bold hover:underline">
            Back to directory
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  /* ── Distance from user ── */
  const distanceFromUser =
    userCoords && business
      ? require("@/lib/geo").getDistanceKm(userCoords, { lat: business.lat, lng: business.lng })
      : null;

  const isOpen = true; // TODO: calculate from business hours

  return (
    <>
      {/* ── Detail-page Navbar (with search) ── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl px-4 sm:px-6 lg:px-20 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-primary shrink-0">
              <span
                className="material-symbols-outlined text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                hexagon
              </span>
              <span className="text-xl font-black tracking-tight text-white uppercase italic hidden sm:block">
                A<span className="text-primary">B</span>A
              </span>
            </Link>
            <nav className="hidden lg:flex items-center gap-8">
              {["Explore", "Categories", "Trending", "About"].map((item) => (
                <Link
                  key={item}
                  href={item === "Explore" ? "/" : `#${item.toLowerCase()}`}
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-1 justify-end items-center gap-4">
            <div className="relative hidden sm:block w-full max-w-xs">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">
                search
              </span>
              <input
                type="text"
                placeholder="Search businesses..."
                className="w-full bg-white/5 border-none rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary/50 outline-none"
              />
            </div>
            <button
              aria-label="Notifications"
              className="size-10 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition-all shrink-0"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20 py-8">

        {/* ── Gallery ── */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10 h-[280px] sm:h-[380px] md:h-[500px]">
          <div className="md:col-span-3 relative group overflow-hidden rounded-2xl bg-[#161811]">
            {loading ? (
              <Skeleton className="w-full h-full rounded-2xl" />
            ) : business?.images[0] ? (
              <Image
                src={business.images[0]}
                alt={business.name}
                fill
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 75vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-8xl text-white/5">business</span>
              </div>
            )}
            {!loading && business && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-2">
                  {business.isFeatured && (
                    <span className="bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Featured
                    </span>
                  )}
                  {business.isPremium && (
                    <span className="bg-white/10 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Premium Listing
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
                  {business.name}
                </h2>
              </div>
            )}
          </div>

          <div className="hidden md:flex flex-col gap-4">
            {[business?.images[1], business?.images[2]].map((img, i) => (
              <div key={i} className="flex-1 rounded-2xl overflow-hidden relative group bg-[#161811]">
                {loading ? (
                  <Skeleton className="w-full h-full" />
                ) : img ? (
                  <Image
                    src={img}
                    alt={`${business?.name} photo ${i + 2}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-white/5">image</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Identity & Actions ── */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 sm:pb-10 custom-divider">
          {loading ? (
            <div className="space-y-3 flex-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          ) : business ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{business.name}</h1>
                {business.isVerified && (
                  <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full">
                    <span
                      className="material-symbols-outlined text-lg"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wide">Verified</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-slate-400 text-sm">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={business.rating} />
                  <span className="font-semibold text-white">{business.rating.toFixed(1)}</span>
                  <span className="opacity-60">({business.reviewCount.toLocaleString()} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">category</span>
                  <span>{business.category}</span>
                </div>
                {distanceFromUser != null && (
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">near_me</span>
                    <span>
                      {formatDistance(distanceFromUser)} •{" "}
                      <span className={isOpen ? "text-primary font-medium" : "text-red-400 font-medium"}>
                        {isOpen ? "Open Now" : "Closed"}
                      </span>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">location_city</span>
                  <span>{business.city}</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            {/* Don't show chat button if viewing your own listing */}
            {business?.ownerId !== user?.uid && (
              <button
                onClick={() => {
                  if (!user) {
                    router.push(`/auth/login?return=/business/${id}`);
                  } else {
                    router.push(`/dashboard/messages?uid=${business?.ownerId}`);
                  }
                }}
                className="flex-1 sm:flex-none h-12 sm:h-14 px-6 sm:px-8 bg-primary text-black font-bold rounded-full hover:brightness-110 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <span className="material-symbols-outlined">chat_bubble</span>
                {user ? "Chat Now" : "Login to Chat"}
              </button>
            )}
            {business?.phone && (
              <a
                href={`tel:${business.phone}`}
                className="flex-1 sm:flex-none h-12 sm:h-14 px-6 sm:px-8 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <span className="material-symbols-outlined">call</span>
                Contact
              </a>
            )}
            <button
              aria-label="Bookmark"
              className="size-12 sm:size-14 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center"
            >
              <span className="material-symbols-outlined">bookmark</span>
            </button>
            <button
              aria-label="Share"
              className="size-12 sm:size-14 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center"
            >
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </section>

        {/* ── Content grid ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 mt-10 sm:mt-12">
          {/* Left */}
          <div className="lg:col-span-8 space-y-10 sm:space-y-12">

            {/* About */}
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            ) : business ? (
              <div>
                <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-3">
                  <span className="w-1 h-6 bg-primary rounded-full" />
                  About the Business
                </h3>
                <p className="text-slate-400 leading-relaxed text-base sm:text-lg font-light">
                  {business.description}
                </p>

                {/* Quick facts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
                  {[
                    { icon: "star", label: `${business.rating} Rating` },
                    { icon: "history", label: `${business.yearsOfExperience}y Experience` },
                    {
                      icon: business.isRemote ? "wifi" : "location_on",
                      label: business.isRemote ? "Remote Available" : "In-Person Only",
                    },
                    { icon: "verified", label: business.isVerified ? "Verified" : "Unverified" },
                  ].map((fact) => (
                    <div
                      key={fact.label}
                      className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center gap-2"
                    >
                      <span className="material-symbols-outlined text-primary">{fact.icon}</span>
                      <span className="text-xs font-medium text-slate-300">{fact.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Contact details */}
            {business && (
              <div className="custom-divider pb-10 sm:pb-12">
                <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-3">
                  <span className="w-1 h-6 bg-primary rounded-full" />
                  Contact Details
                </h3>
                <div className="space-y-4">
                  {business.phone && (
                    <a
                      href={`tel:${business.phone}`}
                      className="flex items-center gap-3 text-slate-400 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-primary">call</span>
                      {business.phone}
                    </a>
                  )}
                  {business.email && (
                    <a
                      href={`mailto:${business.email}`}
                      className="flex items-center gap-3 text-slate-400 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-primary">mail</span>
                      {business.email}
                    </a>
                  )}
                  {business.website && (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-slate-400 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-primary">public</span>
                      {business.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-4 space-y-6 sm:space-y-8">
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 sm:p-8 lg:sticky lg:top-28">
              <h4 className="text-white font-bold mb-5 flex items-center justify-between">
                Location
                <span className="material-symbols-outlined text-primary">map</span>
              </h4>

              {/* Google Static Map */}
              <div className="w-full h-44 rounded-2xl overflow-hidden mb-5 relative bg-[#161811]">
                {business && business.lat !== 0 ? (
                  <>
                    <Image
                      src={staticMapUrl(business.lat, business.lng)}
                      alt={`Map of ${business.name}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {/* Glowing pin */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="size-5 bg-primary rounded-full shadow-[0_0_20px_rgba(205,250,71,0.8)] flex items-center justify-center">
                        <div className="size-2 bg-[#0a0a0a] rounded-full" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-white/5">map</span>
                  </div>
                )}
                {distanceFromUser != null && (
                  <div className="absolute bottom-3 left-3 bg-[#0a0a0a]/80 text-primary text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">near_me</span>
                    {formatDistance(distanceFromUser)}
                  </div>
                )}
              </div>

              {business && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-primary shrink-0">location_on</span>
                    <div className="text-sm">
                      <p className="text-white font-medium">{business.address}</p>
                      <p className="text-slate-400">{business.city}</p>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${business.address}, ${business.city}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full py-3 sm:py-4 rounded-2xl bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Open in Google Maps
                  </a>
                </div>
              )}
            </div>

            {/* Trust badges */}
            {business && (
              <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 sm:p-8">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">verified_user</span>
                  Trust Badges
                </h4>
                <div className="flex flex-wrap gap-4">
                  {business.isVerified && (
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <span className="material-symbols-outlined text-lg text-primary">gpp_good</span>
                      Identity Verified
                    </div>
                  )}
                  {business.isPremium && (
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <span className="material-symbols-outlined text-lg text-primary">workspace_premium</span>
                      Premium Member
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="material-symbols-outlined text-lg text-primary">payments</span>
                    Secure Payments
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Similar businesses ── */}
        {similar.length > 0 && (
          <section className="mt-20 sm:mt-24 pt-10 border-t border-white/5">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Similar Businesses Nearby
              </h3>
              <Link href="/" className="text-primary text-sm font-bold hover:underline shrink-0">
                Explore all
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {similar.map((biz) => (
                <Link
                  key={biz.id}
                  href={`/business/${biz.id}`}
                  className="group cursor-pointer"
                >
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 relative bg-[#161811]">
                    {biz.images[0] && (
                      <Image
                        src={biz.images[0]}
                        alt={biz.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    )}
                    {biz.distanceKm != null && (
                      <div className="absolute bottom-2 right-2 bg-[#0a0a0a]/80 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {formatDistance(biz.distanceKm)}
                      </div>
                    )}
                  </div>
                  <h4 className="text-white font-bold text-sm sm:text-base group-hover:text-primary transition-colors">
                    {biz.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
                    <span
                      className="material-symbols-outlined text-sm text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="text-white font-bold">{biz.rating.toFixed(1)}</span>
                    <span>({biz.reviewCount})</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

    </>
  );
}

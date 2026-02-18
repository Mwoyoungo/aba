"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";
import { logoutUser } from "@/lib/auth";
import { getBusinessById, updateBusiness, type Business } from "@/lib/firestore";
import { storage } from "@/lib/firebase";
import { staticMapUrl, googleMapsUrl } from "@/lib/maps";
import PlacesAutocomplete, { type PlaceResult } from "@/components/PlacesAutocomplete";

const MAX_IMAGES = 6;

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [bizLoading, setBizLoading] = useState(true);

  /* Edit location state */
  const [editingLocation, setEditingLocation] = useState(false);
  const [pendingPlace, setPendingPlace] = useState<PlaceResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /* Image upload state */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  const fetchBusiness = useCallback(() => {
    if (!user) return;
    setBizLoading(true);
    getBusinessById(user.uid)
      .then(setBusiness)
      .catch(console.error)
      .finally(() => setBizLoading(false));
  }, [user]);

  useEffect(() => { fetchBusiness(); }, [fetchBusiness]);

  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
  };

  const handleSaveLocation = async () => {
    if (!pendingPlace || !user) return;
    setSaving(true);
    try {
      await updateBusiness(user.uid, {
        address: pendingPlace.address,
        city: pendingPlace.city,
        lat: pendingPlace.lat,
        lng: pendingPlace.lng,
      });
      setSaveSuccess(true);
      setEditingLocation(false);
      setPendingPlace(null);
      fetchBusiness();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* ── Image upload ── */
  const handleImageUpload = async (files: FileList) => {
    if (!user || !business) return;
    const currentImages = business.images ?? [];
    const slots = MAX_IMAGES - currentImages.length;
    if (slots <= 0) return;

    const toUpload = Array.from(files).slice(0, slots);
    setUploading(true);
    setUploadError("");
    setUploadProgress(0);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        const storageRef = ref(
          storage,
          `businesses/${user.uid}/images/${Date.now()}_${file.name}`
        );
        await new Promise<void>((resolve, reject) => {
          const task = uploadBytesResumable(storageRef, file);
          task.on(
            "state_changed",
            (snap) => {
              const overall =
                ((i + snap.bytesTransferred / snap.totalBytes) / toUpload.length) * 100;
              setUploadProgress(Math.round(overall));
            },
            reject,
            async () => {
              const url = await getDownloadURL(task.snapshot.ref);
              newUrls.push(url);
              resolve();
            }
          );
        });
      }

      const merged = [...currentImages, ...newUrls];
      await updateBusiness(user.uid, { images: merged });
      fetchBusiness();
    } catch (err) {
      console.error(err);
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ── Image remove ── */
  const handleImageRemove = async (url: string) => {
    if (!user || !business) return;
    setRemovingUrl(url);
    try {
      const updated = business.images.filter((u) => u !== url);
      await updateBusiness(user.uid, { images: updated });
      fetchBusiness();
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingUrl(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="size-8 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const locationSet = business && (business.lat !== 0 || business.lng !== 0);
  const images = business?.images ?? [];
  const canAddMore = images.length < MAX_IMAGES;

  const stats = [
    { icon: "visibility", label: "Profile Views", value: "—", note: "coming soon" },
    { icon: "chat_bubble", label: "Messages", value: "—", note: "coming soon" },
    { icon: "star", label: "Rating", value: business?.rating ? business.rating.toFixed(1) : "—" },
    { icon: "rate_review", label: "Reviews", value: business?.reviewCount ?? "—" },
  ];

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md px-4 sm:px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="size-8 bg-primary rounded-full flex items-center justify-center text-[#0a0a0a]">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
          </div>
          <span className="font-extrabold tracking-tight text-white">
            A<span className="text-primary">B</span>A
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-white/40">{profile?.displayName ?? user.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-full hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span className="hidden sm:block">Sign out</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">

        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Welcome back, {profile?.displayName?.split(" ")[0] ?? "there"} 👋
            </h1>
            <p className="text-white/40 mt-1 text-sm">Manage your business listing and track performance.</p>
          </div>
          {saveSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-semibold">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Location updated!
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#161811] border border-[#353a27]/30 rounded-2xl p-5 flex flex-col gap-2">
              <span className="material-symbols-outlined text-primary text-xl">{s.icon}</span>
              <span className="text-2xl font-black text-white">{s.value}</span>
              <span className="text-xs text-white/40 font-medium uppercase tracking-widest">{s.label}</span>
              {s.note && <span className="text-[10px] text-white/20">{s.note}</span>}
            </div>
          ))}
        </div>

        {/* Business listing card */}
        <div className="bg-[#161811] border border-[#353a27]/30 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">store</span>
              Your Listing
            </h2>
            {business && (
              <Link
                href={`/business/${user.uid}`}
                className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
              >
                <span className="material-symbols-outlined text-base">open_in_new</span>
                View public page
              </Link>
            )}
          </div>

          {bizLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-5 bg-white/5 rounded w-48" />
              <div className="h-4 bg-white/5 rounded w-full" />
              <div className="h-4 bg-white/5 rounded w-3/4" />
            </div>
          ) : business ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-bold text-white">{business.name}</h3>
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-semibold">{business.category}</span>
                {business.isVerified && (
                  <span className="text-xs px-2 py-0.5 bg-white/5 text-white/60 rounded-full">Verified</span>
                )}
              </div>
              <p className="text-white/50 text-sm leading-relaxed">{business.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { icon: "location_on", text: `${business.address}, ${business.city}` },
                  { icon: "call", text: business.phone || "No phone added" },
                  { icon: "mail", text: business.email },
                ].map((item) => (
                  <div key={item.icon} className="flex items-center gap-2 text-sm text-white/50">
                    <span className="material-symbols-outlined text-base text-primary shrink-0">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-white/40 text-sm">No business found for your account.</p>
          )}
        </div>

        {/* ── Listing Photos ── */}
        <div className="bg-[#161811] border border-[#353a27]/30 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">photo_library</span>
                Listing Photos
              </h2>
              <p className="text-white/30 text-xs mt-1">{images.length} / {MAX_IMAGES} photos used</p>
            </div>
            {canAddMore && business && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-[#0a0a0a] rounded-full text-sm font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined text-base">add_photo_alternate</span>
                Add Photos
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            />
          </div>

          {!business && !bizLoading && (
            <p className="text-white/30 text-sm">Create your listing first to add photos.</p>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="mb-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="size-3 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                  Uploading...
                </span>
                <span className="text-primary font-bold">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload error */}
          {uploadError && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              {uploadError}
            </div>
          )}

          {/* Photos grid */}
          {business && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Existing images */}
              {images.map((url) => (
                <div key={url} className="relative group aspect-video rounded-2xl overflow-hidden bg-[#0d0d0d]">
                  <Image
                    src={url}
                    alt="Business photo"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  {/* Remove overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handleImageRemove(url)}
                      disabled={removingUrl === url}
                      className="size-10 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400 transition-colors disabled:opacity-50"
                    >
                      {removingUrl === url ? (
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-white text-lg">delete</span>
                      )}
                    </button>
                  </div>
                  {/* Order badge */}
                  <div className="absolute top-2 left-2 bg-[#0a0a0a]/70 text-white/60 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {images.indexOf(url) === 0 ? "Cover" : `#${images.indexOf(url) + 1}`}
                  </div>
                </div>
              ))}

              {/* Empty slots */}
              {canAddMore && !uploading && Array.from({ length: Math.min(MAX_IMAGES - images.length, 3 - (images.length % 3 || 3)) }).map((_, i) => (
                <button
                  key={`empty-${i}`}
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <span className="material-symbols-outlined text-white/20 text-2xl group-hover:text-primary/60 transition-colors">add_photo_alternate</span>
                  <span className="text-white/20 text-xs group-hover:text-primary/60 transition-colors">Add photo</span>
                </button>
              ))}
            </div>
          )}

          {business && images.length === 0 && !uploading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="size-16 bg-white/5 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-white/20">add_photo_alternate</span>
              </div>
              <p className="text-white/40 text-sm">No photos yet</p>
              <p className="text-white/20 text-xs">Add up to {MAX_IMAGES} photos to showcase your business</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-sm font-semibold hover:bg-primary/20 transition-all"
              >
                <span className="material-symbols-outlined text-base">upload</span>
                Upload your first photo
              </button>
            </div>
          )}

          {images.length > 0 && (
            <p className="text-white/20 text-xs mt-4">
              Hover over a photo and click the trash icon to remove it. The first photo is your cover image.
            </p>
          )}
        </div>

        {/* ── Location card ── */}
        <div className="bg-[#161811] border border-[#353a27]/30 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">near_me</span>
              Business Location
            </h2>
            {!editingLocation && (
              <button
                onClick={() => setEditingLocation(true)}
                className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
              >
                <span className="material-symbols-outlined text-base">edit_location_alt</span>
                {locationSet ? "Update Location" : "Set Location"}
              </button>
            )}
          </div>

          {/* No location warning */}
          {!locationSet && !editingLocation && (
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl mb-6">
              <span className="material-symbols-outlined text-yellow-400 shrink-0">warning</span>
              <div>
                <p className="text-yellow-400 text-sm font-semibold">Location not set</p>
                <p className="text-yellow-400/60 text-xs mt-0.5">
                  Your business won&apos;t appear in proximity searches until you set your location.
                </p>
              </div>
            </div>
          )}

          {/* Map preview when location is set */}
          {locationSet && !editingLocation && business && (
            <div className="space-y-4">
              <div className="w-full h-48 rounded-2xl overflow-hidden relative">
                <Image
                  src={staticMapUrl(business.lat, business.lng)}
                  alt="Business location map"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="size-5 bg-primary rounded-full shadow-[0_0_20px_rgba(205,250,71,0.8)] flex items-center justify-center">
                    <div className="size-2 bg-[#0a0a0a] rounded-full" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <span className="material-symbols-outlined text-primary text-base">location_on</span>
                  {business.address}, {business.city}
                </div>
                <a
                  href={googleMapsUrl(business.address, business.city)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Open in Maps
                </a>
              </div>
            </div>
          )}

          {/* Edit location form */}
          {editingLocation && (
            <div className="space-y-4">
              <p className="text-white/40 text-sm">
                Search for your business address below. We&apos;ll automatically extract the coordinates.
              </p>

              <PlacesAutocomplete
                defaultValue={business?.address ?? ""}
                placeholder="Search your business address..."
                onSelect={(place) => setPendingPlace(place)}
              />

              {pendingPlace && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-1">
                  <p className="text-primary text-sm font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    {pendingPlace.address}
                  </p>
                  <p className="text-white/40 text-xs pl-6">
                    {pendingPlace.city} · {pendingPlace.lat.toFixed(5)}, {pendingPlace.lng.toFixed(5)}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveLocation}
                  disabled={!pendingPlace || saving}
                  className="flex-1 py-3 bg-primary text-[#0a0a0a] font-bold rounded-full hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="size-4 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">save</span>
                      Save Location
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setEditingLocation(false); setPendingPlace(null); }}
                  className="px-6 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-full hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Messages ── */}
        <div className="bg-[#161811] border border-[#353a27]/30 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">chat</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Messages</h2>
                <p className="text-white/30 text-xs mt-0.5">Chat with customers in real-time</p>
              </div>
            </div>
            <Link
              href="/dashboard/messages"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-[#0a0a0a] rounded-full text-sm font-bold hover:brightness-110 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-base">open_in_new</span>
              Open Inbox
            </Link>
          </div>
        </div>

        {/* Coming soon */}
        <div className="bg-[#161811] border border-[#353a27]/20 rounded-2xl p-6 opacity-60">
          <span className="material-symbols-outlined text-primary text-2xl mb-3 block">bar_chart</span>
          <h4 className="text-white font-semibold text-sm mb-1">Analytics</h4>
          <p className="text-white/40 text-xs">View detailed stats (coming soon)</p>
        </div>
      </main>
    </div>
  );
}

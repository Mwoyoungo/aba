"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerBusinessOwner, getAuthErrorMessage } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import PlacesAutocomplete, { type PlaceResult } from "@/components/PlacesAutocomplete";

const CATEGORIES = [
  { id: "legal", label: "Legal" },
  { id: "finance", label: "Finance" },
  { id: "creative", label: "Creative & Design" },
  { id: "health", label: "Health & Medical" },
  { id: "real-estate", label: "Real Estate" },
  { id: "technology", label: "Technology" },
  { id: "education", label: "Education" },
  { id: "hospitality", label: "Hospitality" },
  { id: "construction", label: "Construction" },
  { id: "retail", label: "Retail" },
  { id: "other", label: "Other" },
];

type Step = 1 | 2;

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  /* Already logged in — skip registration */
  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard");
  }, [authLoading, user, router]);

  const [step, setStep] = useState<Step>(1);

  /* Step 1 — account */
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* Step 2 — business */
  const [businessName, setBusinessName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [phone, setPhone] = useState("");
  const [placeResult, setPlaceResult] = useState<PlaceResult | null>(null);
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ── Step 1 validation ── */
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setStep(2);
  };

  /* ── Final submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    setLoading(true);
    try {
      const category = CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
      await registerBusinessOwner({
        fullName,
        email,
        password,
        businessName,
        categoryId,
        category,
        phone,
        address: placeResult?.address ?? "",
        city: placeResult?.city ?? "",
        lat: placeResult?.lat,
        lng: placeResult?.lng,
        description,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(getAuthErrorMessage(code));
      setStep(1); // send back to step 1 if auth fails
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 size-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 size-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-10">
          <div className="size-10 bg-primary rounded-full flex items-center justify-center text-[#0a0a0a]">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              diamond
            </span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">
            A<span className="text-primary">B</span>A
          </span>
        </Link>

        <div className="bg-[#161811] border border-[#353a27]/50 rounded-3xl p-8 sm:p-10">

          {/* Progress indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((n) => (
              <div key={n} className="flex items-center gap-3 flex-1">
                <div
                  className={`size-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                    step >= n
                      ? "bg-primary text-[#0a0a0a]"
                      : "bg-white/5 text-white/30 border border-white/10"
                  }`}
                >
                  {step > n ? (
                    <span className="material-symbols-outlined text-base">check</span>
                  ) : (
                    n
                  )}
                </div>
                {n < 2 && (
                  <div className={`flex-1 h-px transition-all ${step > n ? "bg-primary" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>

          {/* ── Step 1: Account details ── */}
          {step === 1 && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
                <p className="text-white/40 text-sm">Step 1 of 2 — Account credentials</p>
              </div>

              <form onSubmit={handleStep1} className="space-y-5">
                {/* Full name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Full name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl">person</span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="John Smith"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Email address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl">mail</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@business.com"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl">lock</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Min. 6 characters"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Confirm password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl">lock_reset</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat password"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <span className="material-symbols-outlined text-base shrink-0">error</span>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-primary text-[#0a0a0a] font-bold rounded-full hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  Continue
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: Business details ── */}
          {step === 2 && (
            <>
              <div className="mb-8">
                <button
                  onClick={() => { setStep(1); setError(""); }}
                  className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-4 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Back
                </button>
                <h1 className="text-2xl font-bold text-white mb-1">Your business</h1>
                <p className="text-white/40 text-sm">Step 2 of 2 — Business details</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Business name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Business name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl">business</span>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                      placeholder="Acme Solutions Ltd."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Category</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl">category</span>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all appearance-none"
                    >
                      <option value="" disabled className="bg-[#161811]">Select a category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#161811]">
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Phone number</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl">call</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="+27 11 123 4567"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                    />
                  </div>
                </div>

                {/* Business address — Google Places autocomplete */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Business address</label>
                  <PlacesAutocomplete
                    placeholder="Search your business address..."
                    onSelect={(place) => setPlaceResult(place)}
                  />
                  {placeResult && (
                    <p className="text-xs text-primary/70 pl-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      {placeResult.city} · {placeResult.lat.toFixed(4)}, {placeResult.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Business description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={3}
                    placeholder="Briefly describe your services..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-none"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <span className="material-symbols-outlined text-base shrink-0">error</span>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-[#0a0a0a] font-bold rounded-full hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="size-4 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">rocket_launch</span>
                      Create Business Account
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-white/40 text-sm mt-8">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

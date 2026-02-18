"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser, sendPasswordReset, getAuthErrorMessage } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

type Step = "login" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  /* Already logged in — go straight to dashboard */
  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard");
  }, [authLoading, user, router]);
  const [step, setStep] = useState<Step>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  /* ── Login submit ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(getAuthErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  /* ── Reset submit ── */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(getAuthErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 size-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 size-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
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

          {/* ── Login form ── */}
          {step === "login" && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
                <p className="text-white/40 text-sm">Sign in to your business account</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Email address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl">
                      mail
                    </span>
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
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl">
                      lock
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
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

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <span className="material-symbols-outlined text-base shrink-0">error</span>
                    {error}
                  </div>
                )}

                {/* Forgot password */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setStep("reset"); setError(""); }}
                    className="text-sm text-white/40 hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-[#0a0a0a] font-bold rounded-full hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="size-4 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              <p className="text-center text-white/40 text-sm mt-8">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="text-primary font-semibold hover:underline">
                  Register your business
                </Link>
              </p>
            </>
          )}

          {/* ── Password reset form ── */}
          {step === "reset" && (
            <>
              <div className="mb-8">
                <button
                  onClick={() => { setStep("login"); setError(""); setResetSent(false); }}
                  className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Back to login
                </button>
                <h1 className="text-2xl font-bold text-white mb-1">Reset password</h1>
                <p className="text-white/40 text-sm">
                  Enter your email and we&apos;ll send a reset link.
                </p>
              </div>

              {resetSent ? (
                <div className="text-center space-y-4">
                  <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      mark_email_read
                    </span>
                  </div>
                  <p className="text-white font-semibold">Email sent!</p>
                  <p className="text-white/40 text-sm">Check your inbox for the password reset link.</p>
                  <button
                    onClick={() => { setStep("login"); setResetSent(false); }}
                    className="w-full py-4 bg-primary text-[#0a0a0a] font-bold rounded-full hover:brightness-110 transition-all mt-4"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Email address</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl">
                        mail
                      </span>
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

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                      <span className="material-symbols-outlined text-base shrink-0">error</span>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-primary text-[#0a0a0a] font-bold rounded-full hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="size-4 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

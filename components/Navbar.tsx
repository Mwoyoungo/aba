"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logoutUser } from "@/lib/auth";

const NAV_LINKS = [
  { label: "Explore", href: "/" },
  { label: "Categories", href: "/#categories" },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/#about" },
];

export default function Navbar() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Close dropdown when clicking outside */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logoutUser();
    router.push("/");
  };

  const initials = profile?.displayName
    ? profile.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() ?? "?";

  return (
    <header className="fixed top-0 w-full z-40 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="size-10 bg-primary rounded-full flex items-center justify-center text-[#0a0a0a]">
            <span className="material-symbols-outlined text-xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
              diamond
            </span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">
            A<span className="text-primary">B</span>A
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-white/60 hover:text-primary transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">

          {/* Auth loading skeleton */}
          {loading && (
            <div className="size-10 rounded-full bg-white/5 animate-pulse" />
          )}

          {/* NOT logged in */}
          {!loading && !user && (
            <Link
              href="/auth/register"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-primary text-[#0a0a0a] rounded-full text-sm font-bold hover:shadow-[0_0_20px_rgba(205,250,71,0.35)] transition-all duration-200 shrink-0"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Add a Listing
            </Link>
          )}

          {/* Logged in — user dropdown */}
          {!loading && user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all"
              >
                {/* Avatar */}
                <div className="size-7 rounded-full bg-primary flex items-center justify-center text-[#0a0a0a] text-xs font-black">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm text-white/70 font-medium max-w-[120px] truncate">
                  {profile?.displayName?.split(" ")[0] ?? user.email}
                </span>
                <span
                  className="material-symbols-outlined text-white/40 text-base transition-transform duration-200"
                  style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  expand_more
                </span>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#161811] border border-[#353a27]/50 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 z-50">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-white text-sm font-semibold truncate">
                      {profile?.displayName ?? "User"}
                    </p>
                    <p className="text-white/40 text-xs truncate">{user.email}</p>
                  </div>

                  {/* Links */}
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-primary">dashboard</span>
                      Dashboard
                    </Link>
                    <Link
                      href={`/business/${user.uid}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-primary">store</span>
                      My Listing
                    </Link>
                    <Link
                      href="/dashboard/messages"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-primary">chat</span>
                      Messages
                    </Link>
                  </div>

                  <div className="border-t border-white/5 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((p) => !p)}
            className="md:hidden size-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:border-primary/50 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">
              {menuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <nav className="md:hidden border-t border-white/5 bg-[#161811] px-6 py-5 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-white/60 hover:text-primary transition-colors py-3 border-b border-white/5 last:border-none"
            >
              {link.label}
            </Link>
          ))}

          {!user ? (
            <Link
              href="/auth/register"
              onClick={() => setMenuOpen(false)}
              className="mt-4 flex items-center justify-center gap-2 px-5 py-3 bg-primary text-[#0a0a0a] rounded-full text-sm font-bold"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Add a Listing
            </Link>
          ) : (
            <div className="mt-4 space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl text-sm text-white font-medium"
              >
                <span className="material-symbols-outlined text-base text-primary">dashboard</span>
                Dashboard
              </Link>
              <Link
                href="/dashboard/messages"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl text-sm text-white font-medium"
              >
                <span className="material-symbols-outlined text-base text-primary">chat</span>
                Messages
              </Link>
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 rounded-2xl text-sm text-red-400 font-medium"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Sign out
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}

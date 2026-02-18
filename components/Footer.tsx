import Link from "next/link";

const DIRECTORY_LINKS = [
  { label: "Legal Services", href: "/category/legal" },
  { label: "Wealth Management", href: "/category/finance" },
  { label: "Creative Agencies", href: "/category/creative" },
  { label: "Health Specialists", href: "/category/health" },
];

const COMPANY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Trust & Safety", href: "/trust" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

const SOCIAL_LINKS = [
  { icon: "public", href: "#", label: "Website" },
  { icon: "share", href: "#", label: "Social" },
  { icon: "mail", href: "#", label: "Email" },
];

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="size-8 bg-primary rounded-full flex items-center justify-center text-[#0a0a0a]">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  diamond
                </span>
              </div>
              <span className="text-base font-extrabold tracking-tight text-white">
                A<span className="text-primary">B</span>A
              </span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Connecting discerning clients with the world&apos;s most trusted
              premium service providers.
            </p>
          </div>

          {/* Directory */}
          <div>
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-widest">
              Directory
            </h4>
            <ul className="space-y-4 text-sm text-white/50">
              {DIRECTORY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-widest">
              Company
            </h4>
            <ul className="space-y-4 text-sm text-white/50">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-widest">
              Connect
            </h4>
            <div className="flex gap-3 mb-8">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="size-10 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:bg-primary hover:text-[#0a0a0a] transition-all duration-200"
                >
                  <span className="material-symbols-outlined text-lg">{s.icon}</span>
                </a>
              ))}
            </div>
            <p className="text-xs text-white/30 uppercase tracking-widest font-bold">
              Join our elite network
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/30 font-medium">
          <p>© {new Date().getFullYear()} ABA. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/instagram" className="hover:text-white transition-colors">
              Instagram
            </a>
            <a href="/linkedin" className="hover:text-white transition-colors">
              LinkedIn
            </a>
            <a href="/twitter" className="hover:text-white transition-colors">
              X (Twitter)
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

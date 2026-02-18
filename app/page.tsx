import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/home/SearchBar";
import BusinessList from "@/components/home/BusinessList";

/* ─── Static category data ─── */
const CATEGORIES = [
  { icon: "gavel", name: "Legal", desc: "Expert counsel & representation", id: "legal" },
  { icon: "payments", name: "Finance", desc: "Strategic wealth management", id: "finance" },
  { icon: "palette", name: "Creative", desc: "Design, media & branding", id: "creative" },
  { icon: "medical_services", name: "Health", desc: "Private specialist care", id: "health" },
  { icon: "domain", name: "Real Estate", desc: "Luxury commercial & residential", id: "real-estate" },
];

const STATS = [
  { value: "12k+", label: "Verified Businesses", desc: "Rigorously screened for exceptional quality." },
  { value: "150+", label: "Cities Covered", desc: "Local expertise across major metro centres." },
  { value: "4.9/5", label: "Client Satisfaction", desc: "Unmatched excellence from verified user data." },
];

/* ─── Page ─── */
export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="pt-20">

        {/* ── Hero ── */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden hero-gradient">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 -left-24 size-[500px] bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 -right-24 size-[400px] bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 w-full max-w-4xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#353a27]/20 border border-[#353a27]/40 text-xs font-semibold uppercase tracking-widest text-primary">
              <span className="material-symbols-outlined text-xs">verified</span>
              Trusted by 12,000+ Businesses
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-[1.1] tracking-tight text-white">
              Find the most trusted{" "}
              <br className="hidden sm:block" />
              <span className="text-primary italic">local businesses</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
              A curated directory of premium services, strictly verified for quality
              and reliability — sorted by distance from you.
            </p>

            <SearchBar />
          </div>
        </section>

        {/* ── Categories ── */}
        <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                Browse by Category
              </h2>
              <p className="text-white/50 text-sm sm:text-base">
                Explore elite services across multiple industries.
              </p>
            </div>
            <Link
              href="/search"
              className="flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all shrink-0"
            >
              View All
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/search?category=${cat.id}`}
                className="group bg-[#161811] border border-[#353a27]/30 p-6 sm:p-8 rounded-[2rem] hover:bg-[#353a27]/20 hover:border-primary/50 transition-all duration-300 flex flex-col"
              >
                <div className="size-12 sm:size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-2xl sm:text-3xl">{cat.icon}</span>
                </div>
                <h3 className="text-base sm:text-xl font-bold text-white mb-1">{cat.name}</h3>
                <p className="text-xs sm:text-sm text-white/40 leading-relaxed">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Business list — fetches from Firestore, detects location, sorts by proximity ── */}
        <BusinessList />

        {/* ── Stats ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex flex-col gap-3 p-8 sm:p-10 bg-[#161811] border border-[#353a27]/30 rounded-[2.5rem] text-center"
              >
                <span className="text-primary text-4xl sm:text-5xl font-black">{s.value}</span>
                <h4 className="text-base sm:text-lg font-bold text-white uppercase tracking-widest">
                  {s.label}
                </h4>
                <p className="text-white/40 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}

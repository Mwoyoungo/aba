/**
 * Seed sample businesses into Firestore.
 * Call via GET /api/seed (dev only — protected by env check).
 *
 * Coordinates are real South African locations so proximity sorting works
 * correctly when the demo is run from SA.
 */

import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "./firebase";

const SEED_BUSINESSES = [
  /* ── Johannesburg / Sandton ── */
  {
    name: "Sandton Legal Group",
    category: "Legal",
    categoryId: "legal",
    description:
      "A full-service commercial law firm specialising in corporate advisory, mergers & acquisitions, and dispute resolution for high-growth businesses across Southern Africa.",
    rating: 4.9,
    reviewCount: 312,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAymKYc3JcuWPQVpG1Y1l9Khc1z4jScfa9K-7am1ZO379c2GKx4h4bUQ3fCvInK6ukn2ms_78dBGwTjRu1VK0eJGQdZzZGy1UbngdZg5yxzOlzxkooUljwORg9D2_gGC7coPRMuhzp3Zeu5ePL-Z70uoZSTtYmMUaRo5x7zBe_riGBPjF14rn5Ih5-Aexlnzl6QVwgfxHNdSIvu9M-1wldwyOkcYzOYxuMQ9ov15i0DVHgSYPDUe0DYoe8dFVHUXy3euvWnaA4Z8WeR",
    ],
    isVerified: true,
    isFeatured: true,
    isPremium: true,
    isRemote: true,
    address: "15 Alice Lane, Sandton",
    city: "Johannesburg",
    lat: -26.1067,
    lng: 28.0567,
    phone: "+27 11 123 4567",
    email: "info@sandtonlegal.co.za",
    website: "https://sandtonlegal.co.za",
    yearsOfExperience: 14,
    ownerId: "",
  },
  {
    name: "Mzansi Capital Partners",
    category: "Finance",
    categoryId: "finance",
    description:
      "Boutique wealth management and private equity firm serving high-net-worth individuals, family offices, and fast-scaling startups across the African continent.",
    rating: 4.8,
    reviewCount: 178,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBiWnv-GkkJUhnmhJ9HFlbuThQD_JdqTDHyZmu3JHVQ9c6_Yy-fEbVIyC_Rqg9I60dwRNRvskEnh2PXXee2doPkDWdueDVeC5iF07N-Ad3rWyjrHM76VBp4-xtZCiaYJhVwAhAyCGR1j2L3pau7cEAQU0OE8QrxHuVhi8uZ-TzlZHSpdsJ9X5HnfTFObybHbApGWEJfIONTIaqtmPmRTAJCtGGD6ezB3-G9ajhwAYcPuH6gGYhSr_HIgmMvtbmGB32mL9lHV7_9CjAE",
    ],
    isVerified: true,
    isFeatured: true,
    isPremium: true,
    isRemote: true,
    address: "The Zone, Rosebank",
    city: "Johannesburg",
    lat: -26.1449,
    lng: 28.0404,
    phone: "+27 11 234 5678",
    email: "info@mzansicapital.co.za",
    website: "https://mzansicapital.co.za",
    yearsOfExperience: 9,
    ownerId: "",
  },
  {
    name: "Creative Hub Joburg",
    category: "Creative",
    categoryId: "creative",
    description:
      "Award-winning digital agency delivering cinematic brand storytelling, UX design, and motion graphics for South Africa's most ambitious brands.",
    rating: 4.7,
    reviewCount: 224,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAd9LvGjv9fxnwNYkO61y-A73L-IRQvFCpBck_8FDGFgy3C_5896xPzQzs9wbDNdWL3Wj-uYbA4kaguPUrBsDgIpIOE6rQ_997IV4_hWL9E9HVDzktnVNB6oJ5bPemIW7maXD5782SnvJhr-RwA3cix9GrE-LdQTJaGyssR5QWWxEQFNN0rADAcz5LDMVdgPmk5oeQ-0jk2h7RCFi9JyykPqhYGcR6DVu5YbNpAdtVoQhl_3aBw9TewFrg-XCdI1JK3PI7ipqbqYnRr",
    ],
    isVerified: true,
    isFeatured: false,
    isPremium: false,
    isRemote: true,
    address: "1 Juta Street, Braamfontein",
    city: "Johannesburg",
    lat: -26.1937,
    lng: 28.0321,
    phone: "+27 11 345 6789",
    email: "studio@creativehubjoburg.co.za",
    website: "https://creativehubjoburg.co.za",
    yearsOfExperience: 6,
    ownerId: "",
  },
  {
    name: "Vitality Health Specialists",
    category: "Health",
    categoryId: "health",
    description:
      "Private specialist practice offering integrative medicine, executive health assessments, and concierge medical services in Morningside, Johannesburg.",
    rating: 5.0,
    reviewCount: 97,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCcpQXv5AoCik9ocHPD60kWQQ_LolUgj7tVci76H0G-uG20oOP194vZkcAkVZ-UM9Mjl-JfPFWtA0CYm5dlUchu6KC632NWArPuPqfj5aWYF_Y_5kHe5iITC4K_tYObtkoQQBt58vP8Ejh4fKOo3Jay6t1ldDid7hnGarVHIasSQSkSMzn4c2c3G4z22qA-6wNpn15jLDYa1Ox0aUE_OMlrBqsnLQgTngR4_wFEuepf8msr4q8xHgcviVvn4zcR4oIfo-RCJhJySNG1",
    ],
    isVerified: true,
    isFeatured: true,
    isPremium: false,
    isRemote: false,
    address: "Morningside Medical Village",
    city: "Johannesburg",
    lat: -26.085,
    lng: 28.0625,
    phone: "+27 11 456 7890",
    email: "info@vitalityhealth.co.za",
    website: "https://vitalityhealth.co.za",
    yearsOfExperience: 18,
    ownerId: "",
  },
  {
    name: "Prime Property SA",
    category: "Real Estate",
    categoryId: "real-estate",
    description:
      "Luxury commercial and residential real estate advisory. Specialising in high-value acquisitions, development projects, and property portfolio management across Gauteng.",
    rating: 4.6,
    reviewCount: 143,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAZJuMhX550lU7fEvwQK1V0vMkPTOwor7wf7kUZ_8BPezgmZJKxLk6FRmBB6Pb5DFLmXGtGVURjP8m1ZQuEjjIKy-m8dEzTiCS4IpKoUiZbS4hUbJckY1VexdgrXG_l5kn2wJpY01SpwBQ80vDF3KbdBCQeZVYgEZcYRzouWpo7QDcUNbrzcBdHSwV_rdG2CVHWmth67-5AzYX7SyPc4HWrgHTrTOta2Gfp0hqjwrCjmrliDlss4EGPisi_OeBAaB0EOkaXlm1QOBOr",
    ],
    isVerified: true,
    isFeatured: false,
    isPremium: false,
    isRemote: false,
    address: "Midrand Business District",
    city: "Johannesburg",
    lat: -25.9964,
    lng: 28.1289,
    phone: "+27 11 567 8901",
    email: "deals@primepropertysa.co.za",
    website: "https://primepropertysa.co.za",
    yearsOfExperience: 11,
    ownerId: "",
  },

  /* ── Pretoria ── */
  {
    name: "Capital Architecture Studio",
    category: "Creative",
    categoryId: "creative",
    description:
      "Bespoke architectural design studio crafting luxury residential homes and civic buildings in Pretoria and Centurion. Sustainable design is at our core.",
    rating: 4.9,
    reviewCount: 88,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB6_DJTk--ZgW7RyjhDHINOdi7xAyh0lU9WO3277SbaFyCWPtovDI7xfybEbEvSwyAKpUrnMu9JPVlzVZn2XJ9Jy9_R8_AHjIlMMQVDb6HIjqP4u-6UzAh-LGZWnBy8QBufFvsLYMRPwXXIz6gyrNQcDq3sNazdj6ueNL7ipIZt5I9WhEzKwdOWdw8EEhdSsXR1wGS2eeIdF-Jb3qKam05lE7i0Mv6KU4UOHMxDdazs5ji67SJQPeGPtEn0gmABofk0vNu2rbTtwwk_",
    ],
    isVerified: true,
    isFeatured: true,
    isPremium: false,
    isRemote: false,
    address: "Hatfield Square, Hatfield",
    city: "Pretoria",
    lat: -25.7479,
    lng: 28.2293,
    phone: "+27 12 123 4567",
    email: "design@capitalarch.co.za",
    website: "https://capitalarch.co.za",
    yearsOfExperience: 7,
    ownerId: "",
  },

  /* ── Cape Town ── */
  {
    name: "Cape Legal Associates",
    category: "Legal",
    categoryId: "legal",
    description:
      "Leading Cape Town litigation and corporate law firm with expertise in property law, maritime law, and fintech regulatory compliance.",
    rating: 4.8,
    reviewCount: 201,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDRRPiukOICn1xkl0M9z5BG62EXskiR_rM4TE8QbdfFEeX_IPrv3MvDTTHM8iWU6QA1bYPmt02WnnudsHbpYFt21YfnovvM3JQha6oZnJtvB_UlWEOaV_VDsu3vC_anI8wCCzTNlBNK4ejh0M9plIcgn-M0NMJ7N8QIPRgO4EO5AVPEu0GD1EzwU405qOBEUpNKBv_hlWrmRkDpiQJNcTvzCFqFmhQfSH3Z7ScFrw3USyFWk3s4kTNQiEjznbp9puysW-atzabqaS7s",
    ],
    isVerified: true,
    isFeatured: false,
    isPremium: true,
    isRemote: true,
    address: "Portside Tower, Cape Town CBD",
    city: "Cape Town",
    lat: -33.9249,
    lng: 18.4241,
    phone: "+27 21 123 4567",
    email: "info@capelegal.co.za",
    website: "https://capelegal.co.za",
    yearsOfExperience: 22,
    ownerId: "",
  },
  {
    name: "Atlantic Wealth Management",
    category: "Finance",
    categoryId: "finance",
    description:
      "Independent wealth management boutique serving Cape Town's affluent community. Specialists in offshore structuring, estate planning, and impact investing.",
    rating: 4.7,
    reviewCount: 134,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAHBlYE-K8qTB8Dys66vrRIXb7u0rbal-vtDO7XtAan6hc2jAL7gkvm9r9JoWBLFiSWYdlf9Qz-uLzR04YqezwurHRo5giuTsMKidRqomJzacRrNEbZod20CzlhqX1Vmbu6Vwbsv2XwNZgnSuTdQoWtPNace02D3EOW11gX3uUcoxYccpDTt93MtkUfjRNH0Lm98EXAnvqwi-lL5JHL2h9n7KLIqOKtINtjYQi7Hzu1QiSBMUFdqtNeLEpjEIA6c8b-vQQ-xJikGlw4",
    ],
    isVerified: false,
    isFeatured: false,
    isPremium: false,
    isRemote: true,
    address: "55 Somerset Road, Sea Point",
    city: "Cape Town",
    lat: -33.9153,
    lng: 18.3997,
    phone: "+27 21 234 5678",
    email: "wealth@atlanticwm.co.za",
    website: "https://atlanticwm.co.za",
    yearsOfExperience: 15,
    ownerId: "",
  },
];

export async function seedBusinesses(): Promise<{ seeded: number }> {
  const batch = writeBatch(db);

  for (const biz of SEED_BUSINESSES) {
    const ref = doc(collection(db, "businesses"));
    batch.set(ref, biz);
  }

  await batch.commit();
  return { seeded: SEED_BUSINESSES.length };
}

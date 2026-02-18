import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  limit,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import { Coordinates, getDistanceKm } from "./geo";

/* ─── Business type ─── */

export interface Business {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  description: string;
  rating: number;
  reviewCount: number;
  images: string[];
  isVerified: boolean;
  isFeatured: boolean;
  isPremium: boolean;
  isRemote: boolean;
  address: string;
  city: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  website: string;
  yearsOfExperience: number;
  ownerId: string;
  /** Calculated client-side after fetch — not stored in Firestore */
  distanceKm?: number;
  /** Composite ranking score — calculated client-side, not stored */
  _score?: number;
}

/* ─── Mapper ─── */

function toBusinesses(data: DocumentData, id: string): Business {
  return {
    id,
    name: data.name ?? "",
    category: data.category ?? "",
    categoryId: data.categoryId ?? "",
    description: data.description ?? "",
    rating: data.rating ?? 0,
    reviewCount: data.reviewCount ?? 0,
    images: data.images ?? [],
    isVerified: data.isVerified ?? false,
    isFeatured: data.isFeatured ?? false,
    isPremium: data.isPremium ?? false,
    isRemote: data.isRemote ?? false,
    address: data.address ?? "",
    city: data.city ?? "",
    lat: data.lat ?? 0,
    lng: data.lng ?? 0,
    phone: data.phone ?? "",
    email: data.email ?? "",
    website: data.website ?? "",
    yearsOfExperience: data.yearsOfExperience ?? 0,
    ownerId: data.ownerId ?? "",
  };
}

/* ─── Smart ranking ─── */

/**
 * Scores how complete a business profile is (0–1).
 * Checks 10 key fields — each filled field adds 0.1 to the score.
 */
function profileCompleteness(b: Business): number {
  const checks = [
    b.name.length > 0,
    b.description.length > 30,   // meaningful description, not just a word
    b.phone.length > 0,
    b.email.length > 0,
    b.website.length > 0,
    b.address.length > 0,
    b.city.length > 0,
    b.images.length > 0,          // at least one photo
    b.lat !== 0 || b.lng !== 0,   // location pinned
    b.yearsOfExperience > 0,
  ];
  return checks.filter(Boolean).length / checks.length;
}

/**
 * Composite ranking score combining all 5 factors from the spec.
 *
 * Weights:
 *   - Rating             25%  (0–5 stars normalised to 0–1)
 *   - Years experience   15%  (capped at 20 years)
 *   - Profile complete   20%  (10-point checklist)
 *   - Distance/radius    30%  (linear decay, 0 km = 1.0, 50 km = 0.0)
 *   - Word match         10%  (fraction of search terms found)
 */
function rankScore(
  b: Business,
  userCoords?: Coordinates,
  terms?: string[]
): number {
  // 1. Rating
  const ratingScore = b.rating / 5;

  // 2. Years of experience (cap at 20)
  const expScore = Math.min(b.yearsOfExperience, 20) / 20;

  // 3. Profile completeness
  const completenessScore = profileCompleteness(b);

  // 4. Distance — closer scores higher
  //    Remote businesses are accessible everywhere, so they get a high fixed score.
  //    If no user location is available, neutral 0.5 so other factors still differ.
  let distanceScore = 0.5;
  if (b.isRemote) {
    distanceScore = 0.85;
  } else if (userCoords && b.distanceKm != null) {
    // Linear decay: 0 km → 1.0 | 50 km → 0.0
    distanceScore = Math.max(0, 1 - b.distanceKm / 50);
  }

  // 5. Word match quality
  //    No search query → full score (1.0) for everyone.
  //    With a query → proportion of terms found in the business text.
  let wordScore = 1.0;
  if (terms && terms.length > 0) {
    const haystack =
      `${b.name} ${b.category} ${b.description} ${b.city}`.toLowerCase();
    const matched = terms.filter((t) => haystack.includes(t)).length;
    wordScore = matched / terms.length;
  }

  return (
    ratingScore    * 0.25 +
    expScore       * 0.15 +
    completenessScore * 0.20 +
    distanceScore  * 0.30 +
    wordScore      * 0.10
  );
}

/**
 * Attach distanceKm to each business and sort by composite score.
 */
function applyRanking(
  results: Business[],
  userCoords?: Coordinates,
  terms?: string[]
): Business[] {
  // Attach distanceKm so both the score and the UI distance badge work
  const withDistance = results.map((b) => ({
    ...b,
    distanceKm:
      userCoords && (b.lat !== 0 || b.lng !== 0)
        ? getDistanceKm(userCoords, { lat: b.lat, lng: b.lng })
        : b.distanceKm,
  }));

  return withDistance
    .map((b) => ({ ...b, _score: rankScore(b, userCoords, terms) }))
    .sort((a, b) => (b._score ?? 0) - (a._score ?? 0));
}

/* ─── Queries ─── */

export interface GetBusinessesOptions {
  categoryId?: string;
  userCoords?: Coordinates;
  radiusKm?: number;
  limitCount?: number;
  remoteOnly?: boolean;
  searchQuery?: string;
}

export async function getBusinesses(opts: GetBusinessesOptions = {}): Promise<Business[]> {
  const constraints: QueryConstraint[] = [];

  if (opts.categoryId) {
    constraints.push(where("categoryId", "==", opts.categoryId));
  }
  if (opts.remoteOnly) {
    constraints.push(where("isRemote", "==", true));
  }

  const q = query(collection(db, "businesses"), ...constraints);
  const snap = await getDocs(q);
  let results: Business[] = snap.docs.map((d) => toBusinesses(d.data(), d.id));

  // Word match filter — must contain every search term somewhere in the listing
  const terms = opts.searchQuery
    ? opts.searchQuery.toLowerCase().split(/\s+/).filter(Boolean)
    : undefined;

  if (terms && terms.length > 0) {
    results = results.filter((b) => {
      const haystack =
        `${b.name} ${b.category} ${b.description} ${b.city}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }

  // Radius filter (needs distance attached first)
  if (opts.userCoords && opts.radiusKm != null) {
    results = results
      .map((b) => ({
        ...b,
        distanceKm: getDistanceKm(opts.userCoords!, { lat: b.lat, lng: b.lng }),
      }))
      .filter((b) => (b.distanceKm ?? Infinity) <= opts.radiusKm!);
  }

  // Apply 5-factor smart ranking
  results = applyRanking(results, opts.userCoords, terms);

  if (opts.limitCount) {
    results = results.slice(0, opts.limitCount);
  }

  return results;
}

/** Fetch a single business by Firestore document ID */
export async function getBusinessById(id: string): Promise<Business | null> {
  const snap = await getDoc(doc(db, "businesses", id));
  if (!snap.exists()) return null;
  return toBusinesses(snap.data(), snap.id);
}

/** Fetch featured businesses, ranked by smart score */
export async function getFeaturedBusinesses(userCoords?: Coordinates): Promise<Business[]> {
  const q = query(
    collection(db, "businesses"),
    where("isFeatured", "==", true),
    limit(12) // fetch more so ranking has room to reorder
  );
  const snap = await getDocs(q);
  const results = snap.docs.map((d) => toBusinesses(d.data(), d.id));
  return applyRanking(results, userCoords).slice(0, 6);
}

/** Fetch businesses in the same category, ranked by smart score */
export async function getSimilarBusinesses(
  currentId: string,
  categoryId: string,
  userCoords?: Coordinates,
  limitCount = 4
): Promise<Business[]> {
  const q = query(
    collection(db, "businesses"),
    where("categoryId", "==", categoryId),
    limit(20)
  );
  const snap = await getDocs(q);
  const results = snap.docs
    .map((d) => toBusinesses(d.data(), d.id))
    .filter((b) => b.id !== currentId);

  return applyRanking(results, userCoords).slice(0, limitCount);
}

/** Update any fields on a business document */
export async function updateBusiness(id: string, data: Partial<Omit<Business, "id">>): Promise<void> {
  await updateDoc(doc(db, "businesses", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

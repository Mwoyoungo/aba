import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type UserCredential,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

/* ─── Types ─── */

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  businessName: string;
  categoryId: string;
  category: string;
  phone: string;
  address: string;
  city: string;
  description: string;
  lat?: number;
  lng?: number;
}

/* ─── Register business owner ─── */

export async function registerBusinessOwner(data: RegisterData): Promise<UserCredential> {
  // 1. Create Firebase Auth account
  const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const { user } = credential;

  // 2. Set display name
  await updateProfile(user, { displayName: data.fullName });

  // 3. Write user profile to Firestore
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: data.email,
    displayName: data.fullName,
    role: "business_owner",
    createdAt: serverTimestamp(),
  });

  // 4. Create the business listing
  const businessRef = doc(db, "businesses", user.uid); // use uid as business doc id for easy lookup
  await setDoc(businessRef, {
    name: data.businessName,
    category: data.category,
    categoryId: data.categoryId,
    description: data.description,
    phone: data.phone,
    email: data.email,
    website: "",
    address: data.address,
    city: data.city,
    lat: data.lat ?? 0,
    lng: data.lng ?? 0,
    rating: 0,
    reviewCount: 0,
    images: [],
    isVerified: false,
    isFeatured: false,
    isPremium: false,
    isRemote: false,
    yearsOfExperience: 0,
    ownerId: user.uid,
    createdAt: serverTimestamp(),
  });

  return credential;
}

/* ─── Login ─── */

export async function loginUser(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

/* ─── Logout ─── */

export async function logoutUser(): Promise<void> {
  return signOut(auth);
}

/* ─── Password reset ─── */

export async function sendPasswordReset(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

/* ─── Friendly Firebase error messages ─── */

export function getAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/invalid-credential": "Invalid email or password.",
  };
  return messages[code] ?? "Something went wrong. Please try again.";
}

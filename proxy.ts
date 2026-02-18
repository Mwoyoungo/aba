// Auth is handled client-side via AuthContext + useEffect redirects in each page.
// This proxy is intentionally minimal to avoid conflicts with Firebase client SDK
// which uses localStorage (not cookies) for session persistence.
//
// Server-side session protection can be added later using Firebase Admin SDK + session cookies.

export function middleware() {
  // passthrough — protection is handled per-page in AuthContext
}

export const config = {
  matcher: [],
};

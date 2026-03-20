const TOKEN_KEY = 'govconnect_token';

/**
 * Retrieve the stored JWT token from localStorage.
 * Returns null if not authenticated or running server-side.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store the JWT token in localStorage.
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove the JWT token (logout).
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Check whether the user is authenticated (token present and not expired).
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = parseJwtPayload(token);
    if (!payload) return false;

    // Check expiry if present
    if (payload.exp) {
      const expiryMs = (payload.exp as number) * 1000;
      if (Date.now() > expiryMs) {
        removeToken();
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Decode and return the JWT payload for the given token.
 * Returns null if the token is malformed.
 */
export function getUserFromToken(token: string): {
  sub: string;
  username: string;
  role: string;
  citizen_id?: string;
  exp?: number;
} | null {
  return parseJwtPayload(token) as { sub: string; username: string; role: string; citizen_id?: string; exp?: number } | null;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Base64url → Base64
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = atob(base64);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// Utility for managing Remember Me session tokens stored in cookies

export function setAuthCookie(token: string, rememberMe: boolean = true): void {
  if (typeof document === 'undefined') return;
  // If rememberMe is checked, store cookie for 30 days. Otherwise, store session cookie (7 days max).
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
  document.cookie = `dandb_remember_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  // Also keep in localStorage as a backup
  try {
    localStorage.setItem('dandb_remember_token', token);
  } catch {}
}

export function getAuthCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const name = 'dandb_remember_token=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) === 0) {
      const val = c.substring(name.length, c.length);
      if (val) return val;
    }
  }
  // Fallback to localStorage if cookie was cleared by browser privacy settings
  try {
    const local = localStorage.getItem('dandb_remember_token');
    if (local) return local;
  } catch {}
  return null;
}

export function clearAuthCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'dandb_remember_token=; path=/; max-age=0; SameSite=Lax';
  try {
    localStorage.removeItem('dandb_remember_token');
  } catch {}
}

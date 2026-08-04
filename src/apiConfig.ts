// Base URL for the backend API. In the split Vercel/Render deployment, the
// frontend and backend live on different origins, so this must point at the
// Render service's public URL (set via VITE_API_URL at build time on Vercel).
// Left empty for local/combined dev, where the Express server also serves
// the frontend and relative "/api/..." paths resolve to the same origin.
export const API_BASE: string = (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") || "";

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

// Default fetch options for every API call — `credentials: "include"` is
// required so the session cookie is sent cross-origin between the Vercel
// frontend and the Render backend (same-origin dev works fine with this too).
export function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(apiUrl(path), {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });
}

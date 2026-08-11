// Resolve API Base URL depending on environment
export const API_BASE = (() => {
  const envUrl = process.env.VITE_API_URL || (import.meta as any).env?.VITE_API_URL;
  if (envUrl && envUrl !== "MY_API_URL" && envUrl.startsWith("http")) {
    return envUrl.replace(/\/$/, "");
  }
  // Fallback to relative path if served from same origin, or default localhost port for local dev
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "";
  }
  return "http://localhost:3001";
})();

/**
 * Customized fetch wrapper that automatically prefixes API requests with API_BASE
 * and ensures cross-origin cookie credentials ('include') are preserved for Discord OAuth sessions.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {})
  };

  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
    credentials: "include" // Critical for passing session cookies across split deployments
  });

  return response;
}
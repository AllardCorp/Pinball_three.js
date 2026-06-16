function resolveApiUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }

  return "http://localhost:3000";
}

export const apiUrl = resolveApiUrl();

export function apiEndpoint(path: string) {
  return new URL(path, apiUrl).toString();
}


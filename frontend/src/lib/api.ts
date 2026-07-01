function resolveApiUrl() {
  const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

  if (shouldUseSameOriginApi(configuredApiUrl)) {
    return resolveSameOriginApiUrl();
  }

  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  if (typeof window !== "undefined") {
    return resolveSameOriginApiUrl();
  }

  return "http://localhost:3000";
}

function resolveSameOriginApiUrl() {
  const location = window.location;

  if (location.origin) {
    return location.origin;
  }

  // Certains environnements de test ne fournissent pas `location.origin`.
  // On reconstruit donc l'origine minimale à partir des champs standards.
  const port = location.port ? `:${location.port}` : "";
  return `${location.protocol}//${location.hostname}${port}`;
}

function isLoopbackApiUrl(value: string) {
  try {
    const { hostname } = new URL(value);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function shouldUseSameOriginApi(configuredApiUrl: string | undefined) {
  if (typeof window === "undefined") {
    return false;
  }

  if (import.meta.env.VITE_APP_TARGET === "public") {
    // Le build public tourne sur le VPS derrière Nginx. Si aucune API n'est
    // configurée, ou si une ancienne config injecte `localhost`, on appelle la
    // même origine pour éviter que le téléphone cherche son propre port 3000.
    return !configuredApiUrl || isLoopbackApiUrl(configuredApiUrl);
  }

  if (import.meta.env.VITE_APP_TARGET !== "flipper") {
    return false;
  }

  // En dev Vite, le frontend tourne sur 5173 et le backend sur 3000 : on garde
  // donc l'URL explicite. En production borne, on ignore volontairement
  // `VITE_API_URL` côté navigateur : le frontend appelle sa propre origine et
  // Nginx relaie `/api` vers le backend Docker interne. Cela évite qu'une
  // variable injectée par l'outil de déploiement fasse pointer Chrome vers un
  // `localhost:3000` inaccessible ou une API distante non voulue.
  if (window.location.port === "5173") {
    return false;
  }

  return true;
}

export const apiUrl = resolveApiUrl();

export function apiEndpoint(path: string) {
  return new URL(path, apiUrl).toString();
}


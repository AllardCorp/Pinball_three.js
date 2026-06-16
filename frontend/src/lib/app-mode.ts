export type AppMode = "web" | "arcade";

export const DEFAULT_APP_MODE: AppMode = "web";

const APP_MODE_URL_BASE = "https://pinball.local";

function isAbsoluteUrl(path: string) {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(path);
}

// On borne explicitement les valeurs acceptées pour éviter
// qu'un `mode` invalide produise des comportements implicites.
export function parseAppMode(value: string | null | undefined): AppMode {
  return value === "arcade" ? "arcade" : DEFAULT_APP_MODE;
}

// Ce helper réinjecte systématiquement `mode` dans une URL relative
// ou absolue afin de préserver le contexte `web` / `arcade`.
export function withAppMode(path: string, mode: AppMode) {
  const url = new URL(path, APP_MODE_URL_BASE);
  url.searchParams.set("mode", mode);

  if (isAbsoluteUrl(path)) {
    return url.toString();
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

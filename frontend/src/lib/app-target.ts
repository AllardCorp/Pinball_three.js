export type AppTarget = "flipper" | "public";

export function parseAppTarget(value: string | null | undefined): AppTarget {
  // Le build `flipper` reste le comportement par défaut : il charge le jeu,
  // MQTT, les écrans DMD/backglass et les routes de borne locale.
  if (value === "public") {
    return "public";
  }

  return "flipper";
}

export const appTarget = parseAppTarget(import.meta.env.VITE_APP_TARGET);

// Ces constantes centralisent le découpage entre le flipper physique et le VPS.
// Elles évitent de disperser des comparaisons de variables Vite dans les pages.
export const isPublicAppTarget = appTarget === "public";
export const isFlipperAppTarget = appTarget === "flipper";

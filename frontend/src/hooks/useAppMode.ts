import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { parseAppMode, withAppMode } from "../lib/app-mode";

export function useAppMode() {
  const [searchParams] = useSearchParams();

  // La source de vérité du mode applicatif est le query param.
  // Toute la couche UI doit donc se brancher dessus.
  const mode = parseAppMode(searchParams.get("mode"));

  return useMemo(
    () => ({
      mode,
      isArcadeMode: mode === "arcade",
      isWebMode: mode === "web",
      // On expose un helper stable pour éviter de dupliquer partout
      // la logique de propagation de `?mode=...`.
      withMode: (path: string) => withAppMode(path, mode),
    }),
    [mode],
  );
}

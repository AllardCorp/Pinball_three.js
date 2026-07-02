import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore/useGameStore";

export default function MultiplierDisplay() {
  const [, setTick] = useState(0);
  const activeMultipliers = useGameStore((state) => state.activeMultipliers);
  const getCurrentMultiplier = useGameStore(
    (state) => state.getCurrentMultiplier,
  );

  // Tick ultra-rapide (50ms) pour garantir la fluidité des barres de progression
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 50);
    return () => clearInterval(interval);
  }, []);

  const currentMultiplier = getCurrentMultiplier();
  const now = Date.now();

  // On récupère, on calcule les pourcentages, et on trie les sources actives
  const activeSources = Object.entries(activeMultipliers)
    .filter(([_, data]) => data.expiresAt > now)
    .map(([source, data]) => {
      const remainingTime = data.expiresAt - now;
      // Sécurité : si totalDuration manque (anciens états), on utilise 15000 par défaut
      const total = data.totalDuration || 15000;

      // Calcul du pourcentage entre 0 et 100
      const percentage = Math.max(
        0,
        Math.min(100, (remainingTime / total) * 100),
      );

      return {
        id: source,
        value: data.value,
        percentage,
        remainingSeconds: (remainingTime / 1000).toFixed(1), // Ex: "12.4s"
      };
    })
    .sort((a, b) => b.value - a.value); // On affiche les plus gros multiplicateurs en haut

  return (
    <div className="mb-6 bg-gray-900 p-4 rounded-lg border border-purple-500/50">
      {/* En-tête avec le multiplicateur global */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-xl text-purple-300">Multiplicateur Actuel</p>
        <p className="text-4xl font-black text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
          x{currentMultiplier}
        </p>
      </div>

      {/* Liste des barres de progression */}
      <div className="flex flex-col gap-3">
        {activeSources.length > 0 ? (
          activeSources.map((item) => (
            <div key={item.id} className="w-full">
              {/* Infos au-dessus de la barre */}
              <div className="flex justify-between text-xs text-purple-200 mb-1 uppercase tracking-wider font-semibold">
                <span>
                  {item.id} (x{item.value})
                </span>
                <span className="tabular-nums">{item.remainingSeconds}s</span>
              </div>

              {/* Le fond de la barre */}
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden border border-gray-700">
                {/* Le remplissage animé */}
                <div
                  className="bg-linear-to-r from-purple-600 to-fuchsia-500 h-2 rounded-full transition-all ease-linear"
                  style={{
                    width: `${item.percentage}%`,
                    transitionDuration: "50ms",
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm italic text-center py-2 border border-dashed border-gray-700 rounded">
            Aucun bonus actif
          </p>
        )}
      </div>
    </div>
  );
}

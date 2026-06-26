import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore/useGameStore";

export default function ClassPowerDisplay() {
  const [, setTick] = useState(0);

  const activeClass = useGameStore((state) => state.activeClass);
  const powerCooldownExpiresAt = useGameStore(
    (state) => state.powerCooldownExpiresAt,
  );
  const powerCooldownTotalDuration = useGameStore(
    (state) => state.powerCooldownTotalDuration,
  );

  // Tick rapide pour animer la barre
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 50);
    return () => clearInterval(interval);
  }, []);

  const now = Date.now();
  const isOnCooldown = powerCooldownExpiresAt > now;
  const remainingTime = Math.max(0, powerCooldownExpiresAt - now);

  // Calcul du pourcentage (de 0 à 100)
  let percentage = 0;
  if (isOnCooldown && powerCooldownTotalDuration > 0) {
    percentage = (remainingTime / powerCooldownTotalDuration) * 100;
  }

  return (
    <div className="rounded border border-slate-600 bg-slate-900 p-3 text-right w-64 flex flex-col justify-between">
      <div>
        <p className="text-sm uppercase tracking-widest text-gray-400">
          Classe Active
        </p>
        <p
          className={`text-2xl font-bold ${activeClass !== "None" ? "text-cyan-400" : "text-gray-500"}`}
        >
          {activeClass !== "None" ? activeClass : "AUCUNE"}
        </p>
      </div>

      {activeClass !== "None" && (
        <div className="mt-3">
          {isOnCooldown ? (
            <div className="w-full">
              <div className="mb-1 flex justify-between text-xs text-red-300 font-semibold uppercase">
                <span>Recharge...</span>
                <span className="tabular-nums">
                  {(remainingTime / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full border border-gray-700 bg-gray-800">
                <div
                  className="h-full rounded-full bg-linear-to-r from-red-600 to-orange-500 transition-all ease-linear"
                  style={{
                    width: `${percentage}%`,
                    transitionDuration: "50ms",
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="animate-pulse text-sm font-bold text-emerald-400">
              ✨ POUVOIR PRÊT !
            </p>
          )}
        </div>
      )}
    </div>
  );
}

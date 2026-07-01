import ClassPowerDisplay from "@/components/display/ClassPowerDisplay";
import MultiplierDisplay from "@/components/display/MultiplierDisplay";
import BackglassScoreClaimPanel from "@/components/score-claim/BackglassScoreClaimPanel";
import { useAppMode } from "@/hooks/useAppMode";
import { useScoreClaimSession } from "@/hooks/useScoreClaimSession";
import { useGameStore } from "@/store/gameStore/useGameStore";

export default function Backglass() {
  const { isArcadeMode, mode } = useAppMode();
  const { snapshot } = useScoreClaimSession({ enabled: false, mode });

  // Donnees globales de la partie.
  const isPlaying = useGameStore((state) => state.isPlaying);
  const playerCount = useGameStore((state) => state.playerCount);
  const currentPlayerIndex = useGameStore((state) => state.currentPlayerIndex);
  const startGame = useGameStore((state) => state.startGame);

  // Donnees joueur synchronisees avec le playfield et le DMD.
  const scores = useGameStore((state) => state.scores);
  const ballsRemaining = useGameStore((state) => state.ballsRemaining);

  // Objectifs et bonus visibles sur le backglass pendant la partie.
  const mineHits = useGameStore((state) => state.mineHits);
  const rubiesActive = useGameStore((state) => state.rubiesActive);
  const screenMessage = useGameStore((state) => state.screenMessage);
  const isUndeathActive = useGameStore((state) => state.isUndeathActive);

  const currentScore = scores[currentPlayerIndex] || 0;
  const currentBalls = ballsRemaining[currentPlayerIndex] || 0;
  const hasPlayed = scores.some((score) => score > 0);

  return (
    <div className="relative p-6 text-xl text-white">
      <h1>Page BackGlass</h1>

      {!isPlaying ? (
        <div className="mt-10 text-center">
          <h2 className="mb-6 text-5xl font-bold text-orange-600">
            {hasPlayed ? "GAME OVER" : "INSERT COIN"}
          </h2>

          {hasPlayed && (
            <div className="mb-8 inline-block min-w-75 rounded-lg border border-gray-600 bg-gray-800 p-6">
              <h3 className="mb-4 border-b border-gray-600 pb-2 text-2xl text-gray-400">
                Scores Finaux
              </h3>
              <div className="flex flex-col gap-2">
                {scores.map((scoreValue, index) => (
                  <div key={index} className="flex justify-between text-2xl">
                    <span className="text-gray-300">Joueur {index + 1}</span>
                    <span className="font-bold text-yellow-400">
                      {scoreValue}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <button
              className="cursor-pointer rounded-lg bg-emerald-600 px-8 py-4 text-2xl font-bold shadow-lg transition-colors hover:bg-emerald-500"
              onClick={() => startGame(playerCount)}
            >
              {hasPlayed ? "Rejouer" : "Demarrer"} ({playerCount} Joueur
              {playerCount > 1 ? "s" : ""})
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <h2 className="mb-4 text-3xl font-bold text-yellow-400">
            Joueur {currentPlayerIndex + 1}
          </h2>

          <div className="mb-8 rounded-lg border border-gray-600 bg-gray-800 p-4">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-4xl font-black text-white">
                  Score: {currentScore}
                </p>
                <p className="text-lg text-gray-300">
                  Billes restantes: {currentBalls}
                </p>
              </div>
              <ClassPowerDisplay />
            </div>

            {isUndeathActive && (
              <div className="mb-6 animate-pulse rounded-lg border-2 border-yellow-400 bg-linear-to-r from-orange-600 to-red-600 p-4 text-center shadow-[0_0_20px_rgba(255,165,0,0.5)]">
                <h3 className="text-3xl font-black tracking-widest text-white">
                  SUN BONUS ACTIF
                </h3>
                <p className="font-bold text-yellow-200">
                  Mode UNDEATH active - bille protegee.
                </p>
              </div>
            )}

            <MultiplierDisplay />

            <div className="flex justify-between rounded bg-black/30 p-3">
              <p className="text-gray-300">
                Mine Hits:{" "}
                <span className="font-bold text-white">{mineHits}/3</span>
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-400">Rubis:</p>
                <ul className="flex gap-2">
                  {rubiesActive.map((ruby, index) => (
                    <li
                      className={`h-4 w-4 rounded-full ${
                        ruby
                          ? "bg-emerald-500 shadow-[0_0_10px_#10b981]"
                          : "bg-gray-700"
                      }`}
                      key={index}
                    />
                  ))}
                </ul>
              </div>
            </div>

            {screenMessage && (
              <p className="mt-4 animate-bounce rounded bg-yellow-900/40 p-2 text-center font-bold text-yellow-300">
                {screenMessage}
              </p>
            )}
          </div>

          {playerCount > 1 && (
            <div>
              <h3 className="mb-2 text-lg text-gray-400">
                Scores de la partie :
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {scores.map((scoreValue, index) => (
                  <div
                    className={`rounded-lg border p-3 ${
                      index === currentPlayerIndex
                        ? "border-yellow-400 bg-gray-700 shadow-[0_0_10px_rgba(250,204,21,0.2)]"
                        : "border-gray-700 bg-gray-900"
                    }`}
                    key={index}
                  >
                    <p className="text-sm text-gray-400">Joueur {index + 1}</p>
                    <p className="text-2xl font-bold">{scoreValue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isArcadeMode && !isPlaying && (
        <BackglassScoreClaimPanel
          className="absolute right-6 top-6 w-80"
          snapshot={snapshot}
        />
      )}
    </div>
  );
}

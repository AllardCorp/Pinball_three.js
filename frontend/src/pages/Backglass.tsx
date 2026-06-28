import { useGameStore } from "@/store/gameStore/useGameStore";
import ScoreClaimQrCode from "../components/score-claim/ScoreClaimQrCode";
import { useAppMode } from "../hooks/useAppMode";
import { useScoreClaimSession } from "../hooks/useScoreClaimSession";
import { getScoreClaimPhaseLabel } from "../lib/score-claim-copy";

export default function Backglass() {
  const { mode } = useAppMode();
  const { snapshot } = useScoreClaimSession({ enabled: false, mode });

  // 1. Données globales de la partie
  const isPlaying = useGameStore((state) => state.isPlaying);
  const playerCount = useGameStore((state) => state.playerCount);
  const currentPlayerIndex = useGameStore((state) => state.currentPlayerIndex);

  // On récupère la fonction pour lancer la partie
  const startGame = useGameStore((state) => state.startGame);

  // 2. Tableaux (Scores et Billes)
  const scores = useGameStore((state) => state.scores);
  const ballsRemaining = useGameStore((state) => state.ballsRemaining);

  // 3. Données du plateau (propres au tour du joueur actuel)
  const scoreMultiplier = useGameStore((state) => state.scoreMultiplier);
  const mineHits = useGameStore((state) => state.mineHits);
  const rubiesActive = useGameStore((state) => state.rubiesActive);

  // Variables dérivées (pour éviter les erreurs si les tableaux sont vides avant le start)
  const currentScore = scores[currentPlayerIndex] || 0;
  const currentBalls = ballsRemaining[currentPlayerIndex] || 0;

  const hasPlayed = scores.some((s) => s > 0);
  const screenMessage = useGameStore((state) => state.screenMessage);

  return (
    <div className="relative min-h-screen overflow-hidden text-xl text-white">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/fontBackglass.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      <div className="relative z-10 p-6">
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
              onClick={() => startGame(playerCount)}
              className="cursor-pointer rounded-lg bg-emerald-600 px-8 py-4 text-2xl font-bold shadow-lg transition-colors hover:bg-emerald-500"
            >
              {hasPlayed ? "Rejouer" : "Démarrer"} ({playerCount} Joueur
              {playerCount > 1 ? "s" : ""})
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">
            Joueur {currentPlayerIndex + 1}
          </h2>

          <div className="bg-gray-800 p-4 rounded-lg mb-8 border border-gray-600">
            <p className="text-4xl font-black mb-4">Score: {currentScore}</p>
            <p>Billes restantes: {currentBalls}</p>
            <p>Multiplicateur: x{scoreMultiplier}</p>
            <p>Mine Hits: {mineHits}</p>

            <div className="mt-4">
              <p className="mb-2">Rubis Actifs:</p>
              <ul className="flex gap-4">
                {rubiesActive.map((rubi, i) => (
                  <li
                    key={i}
                    className={
                      rubi
                        ? "w-6 h-6 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
                        : "w-6 h-6 rounded-full bg-gray-600"
                    }
                  />
                ))}
              </ul>
            </div>
            <p className="mt-2">Message : {screenMessage}</p>
          </div>

          {playerCount > 1 && (
            <div>
              <h3 className="text-lg text-gray-400 mb-2">
                Scores de la partie :
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {scores.map((scoreValue, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      index === currentPlayerIndex
                        ? "border-yellow-400 bg-gray-700"
                        : "border-gray-700 bg-gray-900"
                    }`}
                  >
                    <p className="text-sm text-gray-400">Joueur {index + 1}</p>
                    <p className="font-bold text-2xl">{scoreValue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(snapshot.claim?.verificationUrl ||
        snapshot.user?.username ||
        snapshot.game) && (
        <aside className="absolute right-6 top-6 w-80 rounded-2xl border border-white/10 bg-black/70 p-4 text-sm shadow-lg backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Score Claim
          </p>
          <h2 className="mt-2 text-lg font-semibold">
            {getScoreClaimPhaseLabel(snapshot.phase)}
          </h2>

          {snapshot.game && (
            <p className="mt-3 text-slate-300">
              Score sauvegardé : {snapshot.game.finalScore}
            </p>
          )}

          {snapshot.claim?.verificationUrl && (
            <div className="mt-4 flex flex-col items-center">
              <ScoreClaimQrCode
                verificationUrl={snapshot.claim.verificationUrl}
              />
              <p className="mt-3 text-center text-xs text-slate-300">
                Scannez pour rattacher le score à votre compte.
              </p>
            </div>
          )}

          {snapshot.user?.username && (
            <p className="mt-4 text-slate-300">
              Score rattaché à {snapshot.user.username}
            </p>
          )}
        </aside>
      )}
      </div>
    </div>
  );
}

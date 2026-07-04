import { useGameStore } from "@/store/gameStore/useGameStore";
import Leaderboard from "../components/Leaderboard";
import ScoreClaimQrCode from "../components/score-claim/ScoreClaimQrCode";
import { useAppMode } from "../hooks/useAppMode";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { useScoreClaimSession } from "../hooks/useScoreClaimSession";
import { getScoreClaimPhaseLabel } from "../lib/score-claim-copy";
// import MultiplierDisplay from "@/components/display/MultiplierDisplay";
// import ClassPowerDisplay from "@/components/display/ClassPowerDisplay";

export default function Backglass() {
  const { mode } = useAppMode();
  const { snapshot } = useScoreClaimSession({ enabled: false, mode });
  const leaderboard = useLeaderboard();

  const playerCount = useGameStore((state) => state.playerCount);
  const startGame = useGameStore((state) => state.startGame);

  const scores = useGameStore((state) => state.scores);

  // const currentScore = scores[currentPlayerIndex] || 0;
  // const currentBalls = ballsRemaining[currentPlayerIndex] || 0;
  const hasPlayed = scores.some((s) => s > 0);


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
        {/* {!isPlaying ? ( */}
        <div className="flex flex-col items-center pt-10">
          {/* <h2 className="mb-8 text-5xl font-bold text-orange-600">
            {hasPlayed ? "GAME OVER" : "INSERT COIN"}
          </h2> */}

          {/* LEADERBOARD */}
          <Leaderboard
            entries={leaderboard.entries}
            isLoading={leaderboard.isLoading}
            error={leaderboard.error}
          />

          {/* SCORES FINAUX (game over uniquement) */}
          {/* {hasPlayed && (
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
          )} */}

          {/* Sélecteur : white_left ← → white_right */}
          <div className="flex items-center gap-6 mb-4">
            <span className="text-white font-bold text-g">Bouton gauche ←</span>
            <span className="text-4xl font-bold text-white">
              {playerCount} Joueur{playerCount > 1 ? "s" : ""}
            </span>
            <span className="text-white font-bold text-g">Bouton droit →</span>
          </div>

          {/* Validation : front_left_green ou clic souris */}
          <button
            onClick={() => startGame(playerCount)}
            className="cursor-pointer rounded-lg bg-emerald-600 px-8 py-4 text-2xl font-bold shadow-lg transition-colors hover:bg-emerald-500"
          >
            {hasPlayed ? "Rejouer" : "Démarrer"}
          </button>
        </div>

        {/* MODULE SCORE CLAIM */}
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

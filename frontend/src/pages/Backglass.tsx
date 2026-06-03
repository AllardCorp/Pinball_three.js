import { useGameStore } from "@/store/useGameStore";

export default function Backglass() {
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

  // On vérifie si une partie a déjà été jouée (si au moins un joueur a fait plus de 0)
  const hasPlayed = scores.some((s) => s > 0);
  // Récupération du message d'écran
  const screenMessage = useGameStore((state) => state.screenMessage);
  return (
    <div className="p-6 text-xl text-white">
      <h1>Page BackGlass</h1>

      {!isPlaying ? (
        // --- ÉCRAN D'ATTENTE / GAME OVER ---
        <div className="mt-10 text-center">
          <h2 className="text-5xl font-bold text-orange-600 mb-6">
            {hasPlayed ? "GAME OVER" : "INSERT COIN"}
          </h2>

          {/* Affichage des scores finaux uniquement si une partie a été jouée */}
          {hasPlayed && (
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 inline-block mb-8 min-w-75">
              <h3 className="text-2xl text-gray-400 mb-4 border-b border-gray-600 pb-2">
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

          {/* Bouton pour relancer (Garde le même nombre de joueurs que la partie précédente) */}
          <div>
            <button
              onClick={() => startGame(playerCount)}
              className=" cursor-pointer px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-2xl font-bold transition-colors shadow-lg"
            >
              {hasPlayed ? "Rejouer" : "Démarrer"} ({playerCount} Joueur
              {playerCount > 1 ? "s" : ""})
            </button>
          </div>
        </div>
      ) : (
        // --- ÉCRAN EN JEU ---
        <div className="mt-6">
          {/* INDICATEUR DU JOUEUR EN COURS */}
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">
            Joueur {currentPlayerIndex + 1}
          </h2>

          {/* STATS DU JOUEUR EN COURS */}
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

          {/* AFFICHAGE DES SCORES GLOBAUX (Uniquement en Multijoueur) */}
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
    </div>
  );
}

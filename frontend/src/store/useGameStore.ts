import { create } from "zustand";

const channel =
  typeof window !== "undefined" ? new BroadcastChannel("pinball-game") : null;

// 1. Définit la "forme" des données du store
interface GameState {
  // --- MULTIJOUEUR ---
  playerCount: number;
  currentPlayerIndex: number; // 0 = Joueur 1, 1 = Joueur 2, etc.
  scores: number[]; // Tableau des scores
  ballsRemaining: number[]; // Tableau des billes par joueur

  // --- ÉTAT DU JEU ---
  isPlaying: boolean;
  scoreMultiplier: number;
  ballInLauncher: boolean;
  mineHits: number;
  rubiesActive: [boolean, boolean, boolean];
  leftKickbackActive: boolean;
  rightKickbackActive: boolean;
  screenMessage: string | null;

  // --- ACTIONS ---
  useKickback: (side: "left" | "right") => void;
  startGame: (players?: number) => void; // On peut passer le nombre de joueurs en paramètre
  addScore: (points: number) => void;
  removeScore: (points: number) => void;
  addScoreMultiplier: () => void;
  removeScoreMultiplier: () => void;
  loseBall: () => void;
  gameOver: () => void;
  setBallInLauncher: (inLauncher: boolean) => void;
  incrementMine: () => void;
  resetMine: () => void;
  toggleRuby: (id: 0 | 1 | 2) => void;
  displayMessage: (message: string, durationInMs?: number) => void;
}

const syncState = (state: Partial<GameState>) => {
  if (channel) {
    channel.postMessage(state);
  }
};

let messageTimeoutId: NodeJS.Timeout | null = null;

export const useGameStore = create<GameState>()((set, get) => {
  if (channel) {
    channel.onmessage = (event) => {
      set(event.data);
    };
  }

  const setAndSync = (newState: Partial<GameState>) => {
    set(newState);
    syncState(newState);
  };

  return {
    // --- VALEURS INITIALES ---
    playerCount: 1,
    currentPlayerIndex: 0,
    scores: [0],
    ballsRemaining: [0],
    ballInLauncher: true,
    isPlaying: false,
    scoreMultiplier: 1,
    mineHits: 0,
    rubiesActive: [false, false, false],
    leftKickbackActive: true,
    rightKickbackActive: true,
    screenMessage: null,
    // --- ACTIONS ---
    startGame: (players = 1) => {
      // On initialise les tableaux en fonction du nombre de joueurs
      const initialScores = Array(players).fill(0);
      const initialBalls = Array(players).fill(3);

      setAndSync({
        playerCount: players,
        currentPlayerIndex: 0, // Le Joueur 1 commence toujours
        scores: initialScores,
        ballsRemaining: initialBalls,
        isPlaying: true,
        ballInLauncher: true,
        scoreMultiplier: 1,
        mineHits: 0,
        rubiesActive: [false, false, false],
        leftKickbackActive: true,
        rightKickbackActive: true,
      });

      console.log(`Début de la partie à ${players} joueur(s) !`);
    },

    setBallInLauncher: (inLauncher) =>
      setAndSync({ ballInLauncher: inLauncher }),

    addScore: (points) => {
      if (get().isPlaying) {
        const newScores = [...get().scores];
        newScores[get().currentPlayerIndex] += points * get().scoreMultiplier;
        setAndSync({ scores: newScores });
      }
    },

    removeScore: (points) => {
      if (get().isPlaying) {
        const newScores = [...get().scores];
        newScores[get().currentPlayerIndex] = Math.max(
          0,
          newScores[get().currentPlayerIndex] - points,
        );
        setAndSync({ scores: newScores });
      }
    },

    addScoreMultiplier: () => {
      if (get().isPlaying) {
        setAndSync({
          scoreMultiplier: Math.min(10, get().scoreMultiplier + 1),
        });
      }
    },

    removeScoreMultiplier: () => {
      if (get().isPlaying) {
        setAndSync({
          scoreMultiplier: Math.max(1, get().scoreMultiplier - 1),
        });
      }
    },

    loseBall: () => {
      const state = get();
      const newBallsRemaining = [...state.ballsRemaining];

      // 1. On retire une bille au joueur actuel
      newBallsRemaining[state.currentPlayerIndex] -= 1;

      // 2. Vérification : Est-ce que TOUS les joueurs sont à 0 bille ?
      const isGameOver = newBallsRemaining.every((balls) => balls <= 0);

      if (isGameOver) {
        setAndSync({ ballsRemaining: newBallsRemaining });
        get().gameOver();
        return;
      }

      // 3. Rotation des joueurs (on cherche le prochain joueur qui a encore des billes)
      let nextPlayer = (state.currentPlayerIndex + 1) % state.playerCount;
      while (newBallsRemaining[nextPlayer] <= 0) {
        nextPlayer = (nextPlayer + 1) % state.playerCount;
      }

      // 4. On lance le tour suivant et on réinitialise le plateau
      setAndSync({
        ballsRemaining: newBallsRemaining,
        currentPlayerIndex: nextPlayer,
        ballInLauncher: true,

        // Reset des objectifs du plateau pour le prochain joueur
        rubiesActive: [false, false, false],
        mineHits: 0,
        scoreMultiplier: 1,
        leftKickbackActive: true,
        rightKickbackActive: true,
      });

      console.log(`Bille perdue. Au tour du Joueur ${nextPlayer + 1} !`);
    },

    gameOver: () => {
      console.log("Game Over !");
      setAndSync({
        isPlaying: false,
      });
    },

    incrementMine: () => {
      const currentHits = get().mineHits;
      if (currentHits < 3) {
        setAndSync({ mineHits: currentHits + 1 });
      }
    },

    resetMine: () => {
      setAndSync({ mineHits: 0 });
    },

    toggleRuby: (id) => {
      const currentRubies = [...get().rubiesActive] as [
        boolean,
        boolean,
        boolean,
      ];
      currentRubies[id] = !currentRubies[id];

      setAndSync({ rubiesActive: currentRubies });

      if (currentRubies.every((ruby) => ruby === true)) {
        get().addScore(5000);
        setAndSync({ rubiesActive: [false, false, false] });
        console.log("Tous les rubis activés + 5000");
      }
    },

    useKickback: (side) => {
      if (side === "left") setAndSync({ leftKickbackActive: false });
      if (side === "right") setAndSync({ rightKickbackActive: false });
    },
    displayMessage: (message, durationInMs = 2000) => {
      // Affiche le message
      setAndSync({ screenMessage: message });

      // Si un ancien minuteur tournait, on l'annule pour éviter qu'il n'efface le nouveau message trop tôt
      if (messageTimeoutId) {
        clearTimeout(messageTimeoutId);
      }

      // 3. Programme l'effacement du message
      messageTimeoutId = setTimeout(() => {
        setAndSync({ screenMessage: null });
      }, durationInMs);
    },
  };
});

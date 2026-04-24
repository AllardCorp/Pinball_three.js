import { create } from "zustand";

// 📡 Canal partagé entre onglets
const channel =
  typeof window !== "undefined" ? new BroadcastChannel("pinball-game") : null;

// 1. On définit la "forme" de nos données (TypeScript)
interface GameState {
  score: number;
  ballsRemaining: number;
  isPlaying: boolean;
  scoreMultiplier: number;
  ballInLauncher: boolean;

  mineHits: number;
  rubiesActive: [boolean, boolean, boolean];

  startGame: () => void;
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
}

// 🧠 Helper : synchronise vers les autres onglets
const syncState = (state: Partial<GameState>) => {
  if (channel) {
    channel.postMessage(state);
  }
};

// 2. Création du store
export const useGameStore = create<GameState>()((set, get) => {
  // 📥 Réception depuis autres onglets
  if (channel) {
    channel.onmessage = (event) => {
      set(event.data);
    };
  }

  // 🔧 Helper local qui sync automatiquement
  const setAndSync = (newState: Partial<GameState>) => {
    set(newState);
    syncState(newState);
  };

  return {
    // --- VALEURS INITIALES ---
    score: 0,
    ballsRemaining: 0,
    ballInLauncher: true,
    isPlaying: false,
    scoreMultiplier: 1,
    mineHits: 0,
    rubiesActive: [false, false, false],

    // --- ACTIONS ---

    startGame: () => {
      setAndSync({
        score: 0,
        ballsRemaining: 3,
        isPlaying: true,
        ballInLauncher: true,
        scoreMultiplier: 1,
        mineHits: 0,
        rubiesActive: [false, false, false],
      });

      console.log(`Début de la partie ! Avec ${get().ballsRemaining} billes.`);
    },

    setBallInLauncher: (inLauncher) =>
      setAndSync({ ballInLauncher: inLauncher }),

    addScore: (points) => {
      if (get().isPlaying) {
        setAndSync({
          score: get().score + points * get().scoreMultiplier,
        });
      }
    },

    removeScore: (points) => {
      if (get().isPlaying) {
        setAndSync({
          score: Math.max(0, get().score - points),
        });
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
      const currentBalls = get().ballsRemaining;

      if (currentBalls > 1) {
        setAndSync({
          ballsRemaining: currentBalls - 1,
          ballInLauncher: true,
          rubiesActive: [false, false, false],
          scoreMultiplier: 1,
        });

        console.log("Bille restante : " + get().ballsRemaining);
      } else {
        get().gameOver();
      }
    },

    gameOver: () => {
      console.log("Game Over !");
      setAndSync({
        ballsRemaining: 0,
        isPlaying: false,
      });
    },

    incrementMine: () => {
      const currentHits = get().mineHits;

      if (currentHits < 3) {
        setAndSync({
          mineHits: currentHits + 1,
        });
      }
    },

    resetMine: () => {
      setAndSync({
        mineHits: 0,
      });
    },

    toggleRuby: (id) => {
      const currentRubies = [...get().rubiesActive] as [
        boolean,
        boolean,
        boolean,
      ];

      currentRubies[id] = !currentRubies[id];

      setAndSync({
        rubiesActive: currentRubies,
      });

      if (currentRubies.every((ruby) => ruby === true)) {
        get().addScore(2500);
        setAndSync({
          rubiesActive: [false, false, false],
        });
        console.log("Tous les rubis activés + 5000");
      }
    },
  };
});

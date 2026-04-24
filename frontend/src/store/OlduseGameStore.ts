import { create } from "zustand";

// 1. On définit la "forme" de nos données (TypeScript)
interface GameState {
  // --- ÉTAT DU JEU ---
  score: number;
  ballsRemaining: number;
  isPlaying: boolean;
  scoreMultiplier: number;
  ballInLauncher: boolean;
  // --- ÉTAT DES MÉCANISMES ---
  mineHits: number;
  rubiesActive: [boolean, boolean, boolean];

  // --- ACTIONS ---
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

// 2. On crée le Store
export const useGameStore = create<GameState>()((set, get) => ({
  // --- VALEURS INITIALES ---
  score: 0,
  ballsRemaining: 0,
  ballInLauncher: true,
  isPlaying: false,
  scoreMultiplier: 1,
  mineHits: 0,
  rubiesActive: [false, false, false],
  // --- LOGIQUE DES ACTIONS ---

  startGame: () => {
    set({
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
  setBallInLauncher: (inLauncher) => set({ ballInLauncher: inLauncher }),

  addScore: (points) => {
    // On ne compte les points que si la partie est en cours
    if (get().isPlaying) {
      set({ score: get().score + points * get().scoreMultiplier });
    }
  },

  removeScore: (points) => {
    if (get().isPlaying) {
      set({ score: Math.max(0, get().score - points) }); // On évite les scores négatifs
    }
  },
  addScoreMultiplier: () => {
    if (get().isPlaying) {
      set({ scoreMultiplier: Math.min(10, get().scoreMultiplier + 1) });
    }
  },
  removeScoreMultiplier: () => {
    if (get().isPlaying) {
      set({ scoreMultiplier: Math.max(1, get().scoreMultiplier - 1) });
    }
  },
  loseBall: () => {
    const currentBalls = get().ballsRemaining;
    if (currentBalls > 1) {
      set({
        ballsRemaining: currentBalls - 1,
        ballInLauncher: true,
        rubiesActive: [false, false, false],
        scoreMultiplier: 1,
      });
      console.log("Bille restante : " + get().ballsRemaining);
    } else {
      // S'il n'y a plus de billes, Game Over
      get().gameOver();
    }
  },

  gameOver: () => {
    console.log("Game Over !");
    set({ ballsRemaining: 0, isPlaying: false });
  },

  // --- MÉCANISME : LA MINE D'OR ---
  incrementMine: () => {
    const currentHits = get().mineHits;
    if (currentHits < 3) {
      set({ mineHits: currentHits + 1 });
    }
  },

  resetMine: () => {
    set({ mineHits: 0 });
  },

  // --- MÉCANISME : LES RUBIS ---
  toggleRuby: (id) => {
    const currentRubies = [...get().rubiesActive] as [
      boolean,
      boolean,
      boolean,
    ];
    currentRubies[id] = !currentRubies[id];
    set({ rubiesActive: currentRubies }); // On inverse l'état du rubi touché (allumé <-> éteint)

    // LA MAGIE DE ZUSTAND : On vérifie le combo directement ici !
    // Si tous les rubis sont 'true'
    if (currentRubies.every((ruby) => ruby === true)) {
      // 1. On donne le méga bonus
      get().addScore(5000);

      // 2. On éteint tous les rubis après un tout petit délai pour que
      // le joueur ait le temps de voir les 3 allumés en même temps
      setTimeout(() => {
        set({ rubiesActive: [false, false, false] });
      }, 500);
    }
  },
}));

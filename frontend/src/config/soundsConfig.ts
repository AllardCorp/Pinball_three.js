export type SoundConfig = {
  url: string | string[];
  volume: number;
  distance?: number;
  pitchMin?: number;
  pitchMax?: number;
  // Paramètres optionnels dédiés au son continu de la bille (BallAudio)
  speedDivisor?: number;
};

export const SOUNDS_CONFIG = {
  // pitch plus bas = plus grave
  ball: {
    rollingPlayfield: {
      url: "/sounds/ball/LOOP_metal_ball_rolling.ogg",
      volume: 3,
      pitchMin: 0.5,
      pitchMax: 0.9,
      speedDivisor: 10
    },
    rollingRock: {
      url: "/sounds/ball/LOOP_metal_ball_rolling.ogg",
      volume: 3,
      pitchMin: 0.1,
      pitchMax: 0.5,
      speedDivisor: 10
    },
    rollingRamps: {
      url: "/sounds/ball/LOOP_rolling_metal.ogg",
      volume: 3,
      pitchMin: 0.4,
      pitchMax: 0.8,
      speedDivisor: 10
    },
    launch: { url: "/sounds/plunger/plungerlaunch.ogg", volume: 1 }
  },
  flipper: {
    up: { url: "/sounds/flipper/arm_up.ogg", volume: 1, pitchMin: 0.9, pitchMax: 1.1 },
    down: { url: "/sounds/flipper/arm_down.ogg", volume: 1, pitchMin: 0.9, pitchMax: 1.1 }
  },
  bumper: {
    hit: {
      url: [
        "/sounds/bumper/bumper_01.ogg",
        "/sounds/bumper/bumper_02.ogg",
        "/sounds/bumper/bumper_03.ogg"
      ],
      volume: 1,
      pitchMin: 0.8,
      pitchMax: 1.2
    }
  },
  slingshot: {
    hit: {
      url: [
        "/sounds/slingshot/slingshot_01.ogg",
        "/sounds/slingshot/slingshot_02.ogg",
        "/sounds/slingshot/slingshot_03.ogg"
      ],
      volume: 1,
      pitchMin: 0.9,
      pitchMax: 1.1
    }
  },
  goldmine: {
    enter: { url: "/sounds/mine/wooden-breaks.ogg", volume: 1, pitchMin: 0.9, pitchMax: 1.1 }
  },
  hole: {
    enter: { url: "/sounds/hole/hole.ogg", volume: 1 }
  },
  kickback: {
    trigger: { url: "/sounds/plunger/plungerlaunch.ogg", volume: 1, pitchMin: 0.9, pitchMax: 1.1 }
  }
};

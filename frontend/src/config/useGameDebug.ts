import { useControls, button, buttonGroup, folder } from "leva";
import { useGameStore } from "@/store/gameStore/useGameStore";

export function useGameDebug() {
  const startGame = useGameStore((state) => state.startGame);
  const activateMultiplier = useGameStore((state) => state.activateMultiplier);
  const resetMultipliers = useGameStore((state) => state.resetMultipliers);
  const resetClassSystem = useGameStore((state) => state.resetClassSystem);
  const debugSetClass = useGameStore((state) => state.debugSetClass);
  const useClassPower = useGameStore((state) => state.useClassPower);
  const spawnSword = useGameStore((state) => state.spawnSword);

  return useControls({
    // Interfaces
    Interface: folder({
      rapierDebug: false,
      perfVisible: true,
    }),
    GameLifecycle: folder({
      "Start Solo (1P)": button(() => startGame(1)),
      "Start Versus (2P)": button(() => startGame(2)),
      "Start Match (3P)": button(() => startGame(3)),
      "Start Arcade (4P)": button(() => startGame(4)),
    }),
    Multipliers: folder(
      {
        "Reset Multiplier": button(() => resetMultipliers()),
        "gems 20s": button(() => activateMultiplier("gems")),
        "mine 25s": button(() => activateMultiplier("mine")),
      },
      { collapsed: true },
    ),
    Classes: folder(
      {
        "Forcer Classe": buttonGroup({
          Nécro: () => debugSetClass("Necromancer"),
          Nain: () => debugSetClass("Dwarf"),
          Guerrier: () => debugSetClass("Warrior"),
          Elfe: () => debugSetClass("Elf"),
        }),

        "Activer Pouvoir": button(() => useClassPower()),

        Reset: button(() => resetClassSystem()),
        "Spawn Épée": button(() => spawnSword()),
      },
      { collapsed: true },
    ),
    // Camera
    Camera: folder(
      {
        isOrthographic: false,
        orbitControls: false,
        useLookAt: true,

        // Position de la caméra
        camX: { value: -0.62, min: -400, max: 400, step: 0.1 },
        camY: { value: 62.6, min: -400, max: 400, step: 0.1 },
        camZ: { value: 30.93, min: -400, max: 400, step: 0.1 },

        // Cible (Mets targetX à 0 pour centrer parfaitement si le flipper est au centre)
        targetX: { value: 0, min: -400, max: 400, step: 0.1 },
        targetY: { value: -3.76, min: -400, max: 400, step: 0.1 },
        targetZ: { value: 2.55, min: -400, max: 400, step: 0.1 },

        // Rotation
        rotX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
        rotY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
        rotZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },

        // Paramètres spécifiques Perspective
        fov: { value: 47.5, min: 10, max: 120, step: 1 },
        filmGauge: { value: 35, min: 1, max: 100, step: 1 },
        filmOffset: { value: 0, min: -400, max: 400, step: 0.1 },

        // Paramètres partagés
        near: { value: 0.1, min: 0.01, max: 10, step: 0.01 },
        far: { value: 1000, min: 10, max: 5000, step: 1 },
      },
      {
        collapsed: true,
      },
    ),

    // Physique
    Physic: folder(
      {
        gravity: { value: { x: 0, y: -80, z: 20 }, step: 0.1 },
      },
      {
        collapsed: true,
      },
    ),
    // Ball
    Ball: folder(
      {
        startingPosition: { value: { x: 12.75, y: -2.3, z: 30.46 }, step: 0.1 },
        BallConfig: folder({
          mass: { value: 3.5, min: 0.1, max: 20, step: 0.1 },
          restitution: { value: 0.2, min: 0, max: 1, step: 0.1 },
          size: { value: 0.6, min: 0.1, max: 5, step: 0.05 },
          linearDamping: { value: 0.1, min: 0, max: 1, step: 0.01 },
          angularDamping: { value: 0.1, min: 0, max: 1, step: 0.01 },
        }),
      },
      { collapsed: true },
    ),
    // Flippers
    Flippers: folder(
      {
        upForce: { value: 55, min: 10, max: 80, step: 0.1 },
        downForce: { value: 35, min: 10, max: 60, step: 0.1 },
      },
      { collapsed: true },
    ),
    // Kickbacks
    Kickbacks: folder(
      {
        leftStrength: { value: 120, min: 0, max: 200, step: 1 },
        rightStrength: { value: 120, min: 0, max: 200, step: 1 },
        leftOrientation: { value: 6, min: -100, max: 100, step: 1 },
        rightOrientation: { value: -6, min: -100, max: 100, step: 1 },
      },
      { collapsed: true },
    ),
    // Slingshots
    Slingshots: folder(
      {
        slingshotsRestitution: { value: 0.2, min: 0, max: 1, step: 0.1 },
        force: { value: 12, min: 0, max: 30, step: 0.1 },
      },
      { collapsed: true },
    ),
    Audio: folder(
      {
        masterVolume: { value: 1, min: 0, max: 5, step: 0.1 },
      },
      { collapsed: true },
    ),
  });
}

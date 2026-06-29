import { useState, useRef } from "react";
import {
  RigidBody,
  CuboidCollider,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useControls, folder, button } from "leva";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { SCORE_VALUES } from "@/config/gameBalancingConfig";

type SewerSystemProps = {
  nodes: any;
  materials: any;
};

export default function SewerSystem({ nodes, materials }: SewerSystemProps) {
  const addScore = useGameStore((state) => state.addScore);
  const displayMessage = useGameStore((state) => state.displayMessage);

  const entryGridRef = useRef<THREE.Mesh>(null);
  const exitGridRef = useRef<THREE.Mesh>(null);

  const [isTeleporting, setIsTeleporting] = useState(false);
  const [exitWallActive, setExitWallActive] = useState(true);

  const entryOpenTarget = useRef(0);
  const exitOpenTarget = useRef(0);

  // OUTIL DE LEVEL DESIGN (Leva)
  // Pas de la config leva global car utile pour le debug et pas pour le gameplay
  const {
    debugMode,
    openDepth,
    animSpeed,
    // POSITION GLOBALE DES MESHES
    enMeshX,
    enMeshY,
    enMeshZ,
    exMeshX,
    exMeshY,
    exMeshZ,

    // CAPTEUR : PROXIMITÉ (Ouvre la grille)
    proxX,
    proxY,
    proxZ,
    proxRX,
    proxRY,
    proxRZ,
    proxW,
    proxH,
    proxD,
    // CAPTEUR : TROU (Téléporte)
    holeX,
    holeY,
    holeZ,
    holeRX,
    holeRY,
    holeRZ,
    holeW,
    holeH,
    holeD,

    // CAPTEUR : DÉGAGEMENT SORTIE (Referme le mur)
    clearX,
    clearY,
    clearZ,
    clearRX,
    clearRY,
    clearRZ,
    clearW,
    clearH,
    clearD,

    // ÉJECTION
    ejDirX,
    ejDirY,
    ejDirZ,
    ejForce,
  } = useControls("Sewer System", {
    Égouts: folder(
      {
        debugMode: { value: false, label: "Afficher Debug" },
        Animations: folder({
          openDepth: {
            value: -2,
            min: -3,
            max: 0,
            step: 0.1,
            label: "Descente (Y)",
          },
          animSpeed: { value: 12, min: 1, max: 30, step: 1, label: "Vitesse" },
        }),
        "1. ENTRÉE": folder({
          "Visuel (Ancrage)": folder({
            enMeshX: { value: 6.6, step: 0.1, label: "Pos X" },
            enMeshY: { value: -2.88, step: 0.1, label: "Pos Y" },
            enMeshZ: { value: -2.45, step: 0.1, label: "Pos Z" },
          }),
          "Capteur: Proximité (Zone)": folder({
            proxX: { value: -1.7, step: 0.1, label: "Offset X" },
            proxY: { value: 0.9, step: 0.1, label: "Offset Y" },
            proxZ: { value: 0.5, step: 0.1, label: "Offset Z" },
            proxRX: {
              value: 0,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: "Rot X",
            },
            proxRY: {
              value: 0.4,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: "Rot Y",
            },
            proxRZ: {
              value: 0,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: "Rot Z",
            },
            proxW: { value: 2.2, min: 0.1, step: 0.1, label: "Largeur (X)" },
            proxH: { value: 0.7, min: 0.1, step: 0.1, label: "Hauteur (Y)" },
            proxD: { value: 3.3, min: 0.1, step: 0.1, label: "Épaisseur (Z)" },
          }),
          "Capteur: Trou (Aspiration)": folder({
            holeX: { value: 1.3, step: 0.1, label: "Offset X" },
            holeY: { value: 0.8, step: 0.1, label: "Offset Y" },
            holeZ: { value: -0.5, step: 0.1, label: "Offset Z" },
            holeRX: {
              value: 0,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: "Rot X",
            },
            holeRY: {
              value: 0.4,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: "Rot Y",
            },
            holeRZ: {
              value: 0,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: "Rot Z",
            },
            holeW: { value: 0.3, min: 0.1, step: 0.1, label: "Largeur (X)" },
            holeH: { value: 0.5, min: 0.1, step: 0.1, label: "Hauteur (Y)" },
            holeD: { value: 1.5, min: 0.1, step: 0.1, label: "Épaisseur (Z)" },
          }),
        }),

        "2. SORTIE": folder({
          "Visuel (Ancrage)": folder({
            exMeshX: { value: 2.42, step: 0.1, label: "Pos X" },
            exMeshY: { value: -2.88, step: 0.1, label: "Pos Y" },
            exMeshZ: { value: -18.56, step: 0.1, label: "Pos Z" },
          }),
          "Capteur: Dégagement (Clear)": folder({
            clearX: { value: -0.4, step: 0.1, label: "Offset X" },
            clearY: { value: 0.5, step: 0.1, label: "Offset Y" },
            clearZ: { value: 0.4, step: 0.1, label: "Offset Z" },
            clearRX: {
              value: 0,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: "Rot X",
            },
            clearRY: {
              value: -0.7,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: "Rot Y",
            },
            clearRZ: {
              value: 0,
              min: -Math.PI,
              max: Math.PI,
              step: 0.05,
              label: "Rot Z",
            },
            clearW: { value: 1.5, min: 0.1, step: 0.1, label: "Largeur (X)" },
            clearH: { value: 0.5, min: 0.1, step: 0.1, label: "Hauteur (Y)" },
            clearD: { value: 0.1, min: 0.1, step: 0.1, label: "Épaisseur (Z)" },
          }),
          Éjection: folder({
            ejDirX: { value: -1, min: -1, max: 1, step: 0.1, label: "Dir X" },
            ejDirY: { value: 0, min: -1, max: 1, step: 0.1, label: "Dir Y" },
            ejDirZ: { value: 0.9, min: -1, max: 1, step: 0.1, label: "Dir Z" },
            ejForce: {
              value: 30,
              min: 0,
              max: 200,
              step: 5,
              label: "Puissance",
            },
          }),
        }),

        "Log Config": button(() => {
          console.log(
            "Configuration des capteurs réglée. (Les données sont dans Leva, tu peux les figer en remplaçant les valeurs initiales par celles obtenues).",
          );
        }),
      },
      { collapsed: true },
    ),
  });

  // ANIMATIONS DES GRILLES
  useFrame((_, delta) => {
    if (entryGridRef.current) {
      const targetY = entryOpenTarget.current * openDepth;
      entryGridRef.current.position.y = THREE.MathUtils.lerp(
        entryGridRef.current.position.y,
        targetY,
        delta * animSpeed,
      );
    }
    if (exitGridRef.current) {
      const targetY = exitOpenTarget.current * openDepth;
      exitGridRef.current.position.y = THREE.MathUtils.lerp(
        exitGridRef.current.position.y,
        targetY,
        delta * animSpeed,
      );
    }
  });
  // GESTIONNAIRES D'ÉVÉNEMENTS
  const handleProximityEnter = (e: any) => {
    if (e.other.rigidBodyObject?.name === "ball" && !isTeleporting)
      entryOpenTarget.current = 1; // La grille d'entrée s'abaisse
  };

  const handleProximityExit = (e: any) => {
    if (e.other.rigidBodyObject?.name === "ball" && !isTeleporting)
      entryOpenTarget.current = 0; // La grille d'entrée remonte
  };

  const handleEntryHit = (e: any) => {
    if (isTeleporting) return;

    if (e.other.rigidBodyObject?.name === "ball") {
      const ballRigidBody = e.other.rigidBody as RapierRigidBody;
      if (!ballRigidBody) return;

      setIsTeleporting(true);
      addScore(SCORE_VALUES.sewerBonus || 500);
      displayMessage("🚇 PASSAGE SECRET !", 2000);

      // "gèle" la bille pendant le trajet
      ballRigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
      ballRigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // Referme immédiatement la porte d'entrée sur la bille
      entryOpenTarget.current = 0;

      setTimeout(() => {
        // La grille de sortie s'abaisse et le mur disparaît.
        exitOpenTarget.current = 1;
        setExitWallActive(false);

        // Téléporte la bille
        ballRigidBody.setTranslation({ x: 4.2, y: -2.2, z: -20.5 }, true);
        ballRigidBody.wakeUp();

        // Éjecte vers l'extérieur
        const impulse = {
          x: ejDirX * ejForce,
          y: ejDirY * ejForce,
          z: ejDirZ * ejForce,
        };
        ballRigidBody.applyImpulse(impulse, true);
      }, 50); // Délai pour laisser le temps à la grille de se refermer avant de téléporter la bille
    }
  };
  const handleExitClear = (e: any) => {
    if (!isTeleporting) return;
    if (e.other.rigidBodyObject?.name === "ball") {
      exitOpenTarget.current = 0;
      setExitWallActive(true);
      setIsTeleporting(false);
    }
  };

  const keyGen = (prefix: string, ...args: number[]) =>
    debugMode ? `${prefix}_${args.join("_")}` : prefix;

  return (
    <group name="sewer_system">
      {/* ZONE D'ENTRÉE */}
      <group position={[enMeshX, enMeshY, enMeshZ]}>
        {/* GRILLE VISUELLE */}
        <mesh
          ref={entryGridRef}
          name="visual_faquir_bars_bottom"
          geometry={nodes.visual_faquir_bars_bottom.geometry}
          material={materials["M_metal.002"]}
        />

        {/* SENSOR 1 : Proximité */}
        <RigidBody
          key={keyGen(
            "enProx",
            proxX,
            proxY,
            proxZ,
            proxRX,
            proxRY,
            proxRZ,
            proxW,
            proxH,
            proxD,
          )}
          type="fixed"
          colliders={false}
          sensor
          position={[proxX, proxY, proxZ]}
          rotation={[proxRX, proxRY, proxRZ]}
          onIntersectionEnter={handleProximityEnter}
          onIntersectionExit={handleProximityExit}
        >
          <CuboidCollider args={[proxW, proxH, proxD]} />
          {debugMode && (
            <mesh>
              <boxGeometry args={[proxW * 2, proxH * 2, proxD * 2]} />
              <meshBasicMaterial
                color="yellow"
                wireframe
                opacity={0.3}
                transparent
              />
            </mesh>
          )}
        </RigidBody>

        {/* SENSOR 2 : Trou */}
        <RigidBody
          key={keyGen(
            "enHole",
            holeX,
            holeY,
            holeZ,
            holeRX,
            holeRY,
            holeRZ,
            holeW,
            holeH,
            holeD,
          )}
          type="fixed"
          colliders={false}
          sensor
          position={[holeX, holeY, holeZ]}
          rotation={[holeRX, holeRY, holeRZ]}
          onIntersectionEnter={handleEntryHit}
        >
          <CuboidCollider args={[holeW, holeH, holeD]} />
          {debugMode && (
            <mesh>
              <boxGeometry args={[holeW * 2, holeH * 2, holeD * 2]} />
              <meshBasicMaterial color="red" wireframe />
            </mesh>
          )}
        </RigidBody>
      </group>

      {/* ZONE DE SORTIE */}

      {/* COLLIDER BLOQUEUR */}
      {exitWallActive && (
        <RigidBody type="fixed" colliders="trimesh" includeInvisible>
          <mesh
            name="coll_hight_playfield_bars_top"
            visible={debugMode}
            geometry={nodes.coll_hight_playfield_bars_top.geometry}
            material={nodes.coll_hight_playfield_bars_top.material}
            position={[2.084, -2.882, -17.598]}
          >
            {debugMode && <meshBasicMaterial color="blue" wireframe />}
          </mesh>
        </RigidBody>
      )}

      <group position={[exMeshX, exMeshY, exMeshZ]}>
        {/* GRILLE VISUELLE */}
        <mesh
          ref={exitGridRef}
          name="visual_hight_playfield_bars_top"
          geometry={nodes.visual_hight_playfield_bars_top.geometry}
          material={materials["M_metal.003"]}
        />

        {/* SENSOR 3 : Dégagement */}
        <RigidBody
          key={keyGen(
            "exClear",
            clearX,
            clearY,
            clearZ,
            clearRX,
            clearRY,
            clearRZ,
            clearW,
            clearH,
            clearD,
          )}
          type="fixed"
          colliders={false}
          sensor
          position={[clearX, clearY, clearZ]}
          rotation={[clearRX, clearRY, clearRZ]}
          onIntersectionExit={handleExitClear}
        >
          <CuboidCollider args={[clearW, clearH, clearD]} />
          {debugMode && (
            <mesh>
              <boxGeometry args={[clearW * 2, clearH * 2, clearD * 2]} />
              <meshBasicMaterial
                color="green"
                wireframe
                opacity={0.3}
                transparent
              />
            </mesh>
          )}
        </RigidBody>

        {/* FLÈCHE D'ÉJECTION */}
        {debugMode && (
          <group position={[0, 1, 0]}>
            <arrowHelper
              args={[
                new THREE.Vector3(ejDirX, ejDirY, ejDirZ).normalize(),
                new THREE.Vector3(0, 0, 0),
                3,
                0xff00ff,
                0.8,
                0.8,
              ]}
            />
          </group>
        )}
      </group>
    </group>
  );
}

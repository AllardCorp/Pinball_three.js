import {
  RigidBody,
  CuboidCollider,
  type CollisionEnterPayload,
} from "@react-three/rapier";
import { useRef, forwardRef, useImperativeHandle, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore/useGameStore";
import ObjectSound from "@/components/sounds/ObjectSound";
import { SOUNDS_CONFIG } from "@/config/soundsConfig";
import { SCORE_VALUES } from "@/config/gameBalancingConfig";
// --- TYPES POUR LE SYSTÈME DE POUSSIÈRE ---
export interface DustEffectRef {
  emit: (origin: THREE.Vector3) => void;
}

interface ParticleState {
  active: boolean;
  life: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  scale: number;
}

type GoldMineProps = {
  nodes: any;
  materials: any;
};

const PARTICLE_COUNT_PER_PUFF = 24; // Nombre de particules émises par "puff"
const MAX_PARTICLES_TOTAL = 48; // Nombre maximum de particules dans le système
const PARTICLE_LIFE_TIME = 1.0; // Durée de vie

// Réglage de la taille
const BASE_GEOMETRY_SIZE = 0.3; // Taille du cube de base.
const START_SCALE_MIN = 0.5; // Échelle de départ minimale (multiplicateur)
const START_SCALE_MAX = 1.5; // Échelle de départ maximale (multiplicateur)

const DustEffect = forwardRef<DustEffectRef, { plankColor: string }>(
  (props, ref) => {
    const instances = useRef<THREE.InstancedMesh>(null!);

    const particles = useMemo<ParticleState[]>(() => {
      return Array.from({ length: MAX_PARTICLES_TOTAL }, () => ({
        active: false,
        life: 0,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        scale: 1,
      }));
    }, []);

    const tempMatrix = useMemo(() => new THREE.Matrix4(), []);

    useImperativeHandle(ref, () => ({
      emit(origin: THREE.Vector3) {
        let countEmitted = 0;
        for (let p of particles) {
          if (!p.active && countEmitted < PARTICLE_COUNT_PER_PUFF) {
            p.active = true;
            p.life = PARTICLE_LIFE_TIME;

            // On décale légèrement l'origine pour que l'explosion ne parte pas d'un seul point
            p.position.copy(origin).add({
              x: (Math.random() - 0.5) * 0.5,
              y: (Math.random() - 0.5) * 0.5,
              z: 0,
            });

            // Taille de départ aléatoire pour chaque particule
            p.scale =
              Math.random() * (START_SCALE_MAX - START_SCALE_MIN) +
              START_SCALE_MIN;

            // Vitesse d'explosion : Plus radiale pour un effet "puff"
            p.velocity.set(
              (Math.random() - 0.5) * 4.0, // x
              (Math.random() + 0.5) * 2.5, // y
              (Math.random() - 0.5) * 4.0, // z
            );
            countEmitted++;
          }
        }
      },
    }));

    useFrame((_, delta) => {
      if (!instances.current) return;

      particles.forEach((p, i) => {
        if (!p.active) {
          tempMatrix.makeScale(0, 0, 0);
          instances.current.setMatrixAt(i, tempMatrix);
          return;
        }

        p.velocity.y -= 4 * delta; // Gravité augmentée (plus lourde)
        p.velocity.multiplyScalar(1 - 2.0 * delta); // Friction d'air TRÈS élevée (effet nuage)
        p.position.addScaledVector(p.velocity, delta);

        p.life -= delta;
        const lifePercent = p.life / PARTICLE_LIFE_TIME;

        // Au lieu de rétrécir de 1 à 0, la particule commence à 0.5,
        // gonfle rapidement à sa taille max (1.0), puis rétrécit.
        let currentScale = p.scale;
        if (lifePercent > 0.8) {
          // Phase de "gonflement" (0.8 à 1.0 de life)
          currentScale =
            p.scale * THREE.MathUtils.lerp(0.5, 1.0, (1.0 - lifePercent) / 0.2);
        } else {
          // Phase de "dissipation" (0.0 à 0.8 de life)
          currentScale = (p.scale * lifePercent) / 0.8;
        }

        if (p.life <= 0) {
          p.active = false;
          return;
        }

        tempMatrix.makeScale(currentScale, currentScale, currentScale);
        tempMatrix.setPosition(p.position);

        // On ajoute une rotation aléatoire constante pour que le grain ne paraisse pas figé
        tempMatrix.multiply(new THREE.Matrix4().makeRotationZ(p.life * 2));

        instances.current.setMatrixAt(i, tempMatrix);
      });

      instances.current.instanceMatrix.needsUpdate = true;
    });

    const dustMaterial = useMemo(() => {
      return new THREE.MeshBasicMaterial({
        color: props.plankColor,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      });
    }, [props.plankColor]);

    return (
      // GÉOMÉTRIE DE BASE avec box geometry pour effet bois
      <instancedMesh
        ref={instances}
        args={[
          new THREE.BoxGeometry(
            BASE_GEOMETRY_SIZE,
            BASE_GEOMETRY_SIZE,
            BASE_GEOMETRY_SIZE,
          ),
          dustMaterial,
          MAX_PARTICLES_TOTAL,
        ]}
      />
    );
  },
);
// COMPOSANT PRINCIPAL : GOLD MINE
export default function GoldMine({ nodes, materials }: GoldMineProps) {
  const displayMessage = useGameStore((state) => state.displayMessage);
  // const mineHits = useGameStore((state) => state.mineHits);
  const mineHits = 3;
  const incrementMine = useGameStore((state) => state.incrementMine);
  const addScore = useGameStore((state) => state.addScore);
  const addZoneScore = useGameStore((state) => state.addZoneScore);
  const dustRef = useRef<DustEffectRef>(null!);

  const lastHitTime = useRef<number>(0);

  const handleGateCollision = (e: CollisionEnterPayload) => {
    if (e.other.rigidBodyObject?.name === "ball") {
      const now = performance.now();
      if (now - lastHitTime.current < 250) return; // Cooldown de 250ms

      lastHitTime.current = now;

      if (mineHits < 3) {
        // Utilise la position de la bille
        if (e.other.rigidBody) {
          const ballPos = e.other.rigidBody.translation();
          // Émet la poussière exactement là où se trouve la bille
          dustRef.current.emit(
            new THREE.Vector3(ballPos.x, ballPos.y, ballPos.z),
          );
        }

        incrementMine();
        addScore(SCORE_VALUES.minePlank);
        console.log("Planche de la mine cassée ! Coups :", mineHits + 1);
      }
      if (mineHits + 1 === 3) {
        displayMessage("Mine détruite ! Bonus de 500 points !", 3000);
      }
    }
  };

  return (
    <group>
      {/* --- PLANCHES VISUELLES --- */}
      {mineHits < 1 && (
        <group name="visual_mine_plank001" position={[-9.978, -1.495, 5.084]}>
          <mesh
            name="light1_Lamp_0002"
            geometry={nodes.light1_Lamp_0002.geometry}
            material={materials.M_wood_medium}
          />
          <mesh
            name="light1_Lamp_0002_1"
            geometry={nodes.light1_Lamp_0002_1.geometry}
            material={materials.M_stone_medium}
          />
        </group>
      )}
      {mineHits < 2 && (
        <group name="visual_mine_plank002" position={[-9.978, -1.495, 5.084]}>
          <mesh
            name="light1_Lamp_0003"
            geometry={nodes.light1_Lamp_0003.geometry}
            material={materials.M_wood_medium}
          />
          <mesh
            name="light1_Lamp_0003_1"
            geometry={nodes.light1_Lamp_0003_1.geometry}
            material={materials.M_stone_medium}
          />
        </group>
      )}
      {mineHits < 3 && (
        <group name="visual_mine_plank003" position={[-9.978, -1.495, 5.084]}>
          <mesh
            name="light1_Lamp_0004"
            geometry={nodes.light1_Lamp_0004.geometry}
            material={materials.M_wood_medium}
          />
          <mesh
            name="light1_Lamp_0004_1"
            geometry={nodes.light1_Lamp_0004_1.geometry}
            material={materials.M_stone_medium}
          />
        </group>
      )}

      {/* --- MUR PHYSIQUE --- */}
      {mineHits < 3 && (
        <RigidBody
          type="fixed"
          colliders="hull"
          restitution={0.5}
          onCollisionEnter={handleGateCollision}
          includeInvisible
        >
          <mesh
            visible={false}
            geometry={nodes.coll_mine_gate.geometry}
            position={[-11.672, -1.9, 6.777]}
          />
        </RigidBody>
      )}

      {/* --- SYSTÈME DE POUSSIÈRE --- */}
      <DustEffect ref={dustRef} plankColor="#D2B48C" />

      {/* --- TÉLÉPORTEUR --- */}
      <RigidBody
        type="fixed"
        sensor
        position={[-12.8, -8.8, 5.4]}
        rotation={[0, 3.7, 0]}
        onIntersectionEnter={(e) => {
          if (e.other.rigidBodyObject?.name === "ball" && e.other.rigidBody) {
            console.log("Jackpot ! La bille est dans la mine !");

            addZoneScore(SCORE_VALUES.mineEntrance, "Mine");

            const ballRigidBody = e.other.rigidBody;

            ballRigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
            ballRigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
            setTimeout(() => {
              ballRigidBody.setTranslation(
                { x: 12.8, y: -1.3, z: -21 },
                true,
              );
              // Impulsion de sortie
              ballRigidBody.applyImpulse({ x: 0, y: 58, z: 0 }, true);
            }, 50);
          }
        }
        }
      >
        <CuboidCollider args={[0.9, 0.9, 0.9]} />
        <ObjectSound {...SOUNDS_CONFIG.goldmine.enter} playTrigger={mineHits} />
      </RigidBody>
    </group>
  );
}

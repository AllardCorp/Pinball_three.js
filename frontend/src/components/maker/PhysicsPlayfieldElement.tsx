import { useRef } from "react";
import { RigidBody, type RapierRigidBody, type CollisionEnterPayload } from "@react-three/rapier";
import { getMakerElementConfig } from "@/config/makerElementConfig";
import type { MakerElement } from "@/store/useMakerStore";
import { ElementGeometry } from "./ElementGeometry";

interface Props {
  element: MakerElement;
}

export function PhysicsPlayfieldElement({ element }: Props) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const config = getMakerElementConfig(element.type);

  const handleCollision = (e: CollisionEnterPayload) => {
    if (!element.isBumper) return;
    if (e.other.rigidBodyObject?.name !== "ball") return;
    if (!rigidBodyRef.current || !e.other.rigidBody) return;

    const ballPos = e.other.rigidBody.translation();
    const bumperPos = rigidBodyRef.current.translation();
    const dx = ballPos.x - bumperPos.x;
    const dy = ballPos.y - bumperPos.y;
    const dz = ballPos.z - bumperPos.z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    const strength = element.bumpStrength ?? config?.defaults.bumpStrength ?? 15;

    e.other.rigidBody.applyImpulse(
      { x: (dx / len) * strength, y: (dy / len) * strength, z: (dz / len) * strength },
      true,
    );
  };

  // Type inconnu (niveau sauvegardé par une version plus récente du Maker) :
  // pas de RigidBody plutôt que de planter la physique.
  if (!config) return null;

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="fixed"
      colliders="hull"
      position={element.position}
      rotation={element.rotation}
      restitution={element.isBumper ? 1.2 : 0.3}
      onCollisionEnter={handleCollision}
    >
      <group scale={element.scale}>
        <mesh castShadow receiveShadow>
          <ElementGeometry type={element.type} />
          <meshStandardMaterial
            color={element.color ?? config.defaults.color}
            roughness={element.roughness ?? config.defaults.roughness}
            metalness={element.metalness ?? config.defaults.metalness}
          />
        </mesh>
      </group>
    </RigidBody>
  );
}

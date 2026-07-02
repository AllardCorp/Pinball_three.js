import { useRef } from "react";
import { RigidBody, type RapierRigidBody, type CollisionEnterPayload } from "@react-three/rapier";
import type { MakerElement } from "@/store/useMakerStore";

interface Props {
  element: MakerElement;
}

export function PhysicsPlayfieldElement({ element }: Props) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);

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
    const strength = element.bumpStrength ?? 15;

    e.other.rigidBody.applyImpulse(
      { x: (dx / len) * strength, y: (dy / len) * strength, z: (dz / len) * strength },
      true,
    );
  };

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
          {element.type === "cylinder" && <cylinderGeometry args={[1.5, 1.5, 1, 32]} />}
          {element.type === "box" && <boxGeometry args={[2, 2, 2]} />}
          {element.type === "sphere" && <sphereGeometry args={[1.2, 32, 32]} />}
          <meshStandardMaterial
            color={element.color ?? "#ffffff"}
            roughness={element.roughness ?? 0.3}
            metalness={element.metalness ?? 0.5}
          />
        </mesh>
      </group>
    </RigidBody>
  );
}

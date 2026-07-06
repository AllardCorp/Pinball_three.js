import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import ObjectSound from "@/components/sounds/ObjectSound";
import { SOUNDS_CONFIG } from "@/config/soundsConfig";
import { useInputStore } from "@/store/inputStore/useInputStore";
import { useGameDebug } from "@/config/useGameDebug";

type FlipperProps = {
  colliderGeometry: THREE.BufferGeometry;
  visualGeometry: THREE.BufferGeometry;
  visualMaterial: THREE.Material;
  position: [number, number, number];
  rotation: [number, number, number];
  side: "left" | "right";
};

export default function Flipper({
  colliderGeometry,
  visualGeometry,
  visualMaterial,
  position,
  rotation,
  side,
}: FlipperProps) {
  const { upForce, downForce } = useGameDebug();
  const flipperRef = useRef<RapierRigidBody>(null);

  const isActive = useInputStore((state) =>
    side === "left" ? state.buttons.white_left : state.buttons.white_right,
  );

  const animProgress = useRef(0);

  const initialPosition = useMemo(
    () => new THREE.Vector3(...position),
    [position],
  );

  useFrame((_, delta) => {
    if (!flipperRef.current) return;
    const speed = isActive ? upForce : downForce; // Vitesse de levée | Vitesse de descente du flipper
    const target = isActive ? 1 : 0;
    animProgress.current = THREE.MathUtils.lerp(
      animProgress.current,
      target,
      delta * speed,
    );

    const swingAngle = Math.PI / 3; // Angle de rotation maximal du flipper (60 degrés)
    const direction = side === "left" ? 1 : -1;
    const currentAngleY =
      rotation[1] + animProgress.current * swingAngle * direction;

    const euler = new THREE.Euler(
      rotation[0],
      currentAngleY,
      rotation[2],
      "XYZ",
    );
    const quaternion = new THREE.Quaternion().setFromEuler(euler);

    // Dis à Rapier de mettre à jour la rotation du flipper pour le prochain frame
    flipperRef.current.setNextKinematicRotation(quaternion);

    // On utilise la position initialisée plus haut pour éviter que le flipper ne "glisse" physiquement sur la table à cause de la rotation
    flipperRef.current.setNextKinematicTranslation(initialPosition);
  });

  return (
    <RigidBody
      ref={flipperRef}
      type="kinematicPosition"
      ccd={true} // Continuous Collision Detection pour éviter que la bille traverse le flipper
      colliders="hull"
      position={position}
      restitution={0.2}
      friction={0.2}
      // Sécurité supplémentaire pour empêcher toute glissade physique
      enabledTranslations={[false, false, false]}
    >
      {/* Mesh de collision (invisible) */}
      <mesh geometry={colliderGeometry}>
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Mesh visuel */}
      <mesh geometry={visualGeometry} material={visualMaterial} />
      {/* Le son s'active quand isActive devient 'true' (flipper monte) */}
      <ObjectSound {...SOUNDS_CONFIG.flipper.up} playTrigger={isActive} />
      {/* Le son s'active quand isActive devient 'false' (flipper descend) */}
      <ObjectSound {...SOUNDS_CONFIG.flipper.down} playTrigger={!isActive} />
    </RigidBody>
  );
}

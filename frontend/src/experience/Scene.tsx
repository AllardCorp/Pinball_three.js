import { RigidBody } from "@react-three/rapier";
import { OrbitControls } from "@react-three/drei";

export default function Scene() {
  return (
    <>
      <OrbitControls />

      <ambientLight />
      <directionalLight position={[2, 5, 2]} />

      {/* Sol */}
      <RigidBody type="fixed" restitution={1}>
        <mesh receiveShadow>
          <boxGeometry args={[10, 0.5, 10]} />
          <meshStandardMaterial color="#F0E7D8" />
        </mesh>
      </RigidBody>

      {/* Bille */}
      <RigidBody colliders="ball" restitution={1}>
        <mesh castShadow position={[0, 5, 0]}>
          <sphereGeometry args={[0.5]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </RigidBody>
    </>
  );
}

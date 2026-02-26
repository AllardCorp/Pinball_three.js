import { RigidBody } from "@react-three/rapier";
import { OrbitControls } from "@react-three/drei";
import { useControls } from "leva";

export default function Experience() {
  const { groundColor } = useControls("ground", {
    groundColor: "greenyellow",
  });
  const { ballColor, ballPosition } = useControls("ball", {
    ballColor: "crimson",
    ballPosition: { value: [0, 5, 0], step: 0.5, min: -10, max: 10 },
  });
  return (
    <>
      <OrbitControls />

      <ambientLight />
      <directionalLight position={[2, 5, 2]} />

      {/* Sol */}
      <RigidBody type="fixed" restitution={1}>
        <mesh receiveShadow>
          <boxGeometry args={[10, 0.5, 10]} />
          <meshStandardMaterial color={groundColor} />
        </mesh>
      </RigidBody>

      {/* Bille */}
      <RigidBody colliders="ball" restitution={1}>
        <mesh castShadow position={ballPosition}>
          <sphereGeometry args={[0.5]} />
          <meshStandardMaterial color={ballColor} />
        </mesh>
      </RigidBody>
    </>
  );
}

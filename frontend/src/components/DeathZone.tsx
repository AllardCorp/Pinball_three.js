import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useControls } from "leva";
import { useGameStore } from "@/store/gameStore/useGameStore";

export default function DeathZone() {
  const loseBall = useGameStore((state) => state.loseBall);

  const { dzX, dzY, dzZ } = useControls("Death Zone Position", {
    dzX: { value: -1.1, min: -20, max: 20, step: 0.1 },
    dzY: { value: -2.3, min: -20, max: 20, step: 0.1 },
    dzZ: { value: 35.3, min: -20, max: 80, step: 0.1 },
  });

  return (
    <RigidBody
      type="fixed"
      position={[dzX, dzY, dzZ]}
      sensor
      onIntersectionEnter={(e) => {
        if (e.other.rigidBodyObject?.name === "ball") {
          console.log("Bille perdue !");
          loseBall();
        }
      }}
    >
      <CuboidCollider args={[0.75, 0.6, 2]} />
    </RigidBody>
  );
}

import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useControls } from "leva";
import { useGameStore } from "@/store/useGameStore";

export default function DeathZone() {
  const loseBall = useGameStore((state) => state.loseBall);

  // Leva pour t'aider à positionner la zone de mort au bon endroit
  const { dzX, dzY, dzZ } = useControls("Death Zone Position", {
    dzX: { value: -1.1, min: -20, max: 20, step: 0.1 },
    dzY: { value: -2.3, min: -20, max: 20, step: 0.1 }, // Bien en dessous du plateau
    dzZ: { value: 35.3, min: -20, max: 80, step: 0.1 }, // En bas du flipper
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
      {/* Un collider très large et profond pour être sûr de rattraper la bille */}
      <CuboidCollider args={[0.75, 0.6, 2]} />
    </RigidBody>
  );
}

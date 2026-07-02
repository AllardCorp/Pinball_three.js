import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useGameStore } from "@/store/gameStore/useGameStore";

export default function DeathZone() {
  const loseBall = useGameStore((state) => state.loseBall);

  return (
    <RigidBody
      type="fixed"
      position={[-1.1, -2.3, 35.3]}
      sensor
      onIntersectionEnter={(e) => {
        if (e.other.rigidBodyObject?.name === "ball") {
          // Récuération de l'ID de la bille
          const ballId = e.other.rigidBodyObject.userData?.id;

          if (ballId) {
            console.log(`Bille tombée : ${ballId}`);

            loseBall(ballId);
          }
        }
      }}
    >
      <CuboidCollider args={[0.75, 0.6, 2]} />
    </RigidBody>
  );
}

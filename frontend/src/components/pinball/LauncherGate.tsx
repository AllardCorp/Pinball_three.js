import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useControls } from "leva";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { SWORD_SPAWN_TIMERS } from "@/config/gameBalancingConfig";

type LuncherGateProps = {
  nodes: any;
  materials: any;
};
export default function LauncherGate({ nodes, materials }: LuncherGateProps) {
  const ballInLauncher = useGameStore((state) => state.ballInLauncher);
  const setBallInLauncher = useGameStore((state) => state.setBallInLauncher);
  const scheduleSwordSpawn = useGameStore((state) => state.scheduleSwordSpawn);

  // Pas de la config leva global car utile pour le debug et pas pour le gameplay
  const { position } = useControls(
    "Launch EndGate sensors Position",
    {
      position: { value: [8.4, -1.6, 5.9], step: 0.1 },
    },
    { collapsed: true },
  );
  return (
    <group>
      {/* 1. LE SENSOR INVISIBLE (Ligne d'arrivée du lanceur) */}
      <RigidBody
        type="fixed"
        sensor
        onIntersectionEnter={(e) => {
          console.log(
            "Intersection ! Nom de l'objet :",
            e.other.rigidBodyObject?.name,
          );
          if (e.other.rigidBodyObject?.name === "ball") {
            console.log("Bille confirmé !");
            setTimeout(() => {
              setBallInLauncher(false);

              scheduleSwordSpawn(SWORD_SPAWN_TIMERS.initial);
            }, 500); // Délai pour être sûr que la bille soit bien passée
          }
        }}
        position={position}
        rotation={[0, Math.PI / 2.6, 0]}
      >
        <CuboidCollider args={[1, 1, 0.2]} />
      </RigidBody>

      {/* VISUEL DE LA GATE) */}
      <mesh
        geometry={nodes.visual_obj_gate_5.geometry}
        material={materials.M_yellow}
        position={[9.283, -1.018, 4.732]}
      />

      {/* COLLIDER PHYSIQUE (N'existe que si la bille a passé le sensor) */}
      {!ballInLauncher && (
        <RigidBody
          includeInvisible
          type="fixed"
          colliders="hull"
          restitution={0}
        >
          <mesh
            visible={false}
            geometry={nodes.coll_gate.geometry}
            position={[8.733, -1.272, 5.992]}
          />
        </RigidBody>
      )}
    </group>
  );
}

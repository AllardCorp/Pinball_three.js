import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { useControls, folder } from "leva";

export default function KillZone() {
  const loseBall = useGameStore((state) => state.loseBall);

  // OUTIL DE LEVEL DESIGN (Leva)
  // Pas dans la config leva global car utile pour le debug et pas pour le gameplay
  const { debugZone, cx, cy, cz, w, h, d } = useControls(
    "Sécurité (Kill Zone)",
    {
      "Volume de confinement": folder(
        {
          debugZone: { value: false, label: "Afficher la Zone" },
          cx: { value: 0, step: 0.5, label: "Centre X" },
          cy: { value: -0.5, step: 0.5, label: "Centre Y" },
          cz: { value: 0, step: 0.5, label: "Centre Z" },
          w: {
            value: 36,
            min: 5,
            max: 100,
            step: 1,
            label: "Largeur interne (X)",
          },
          h: {
            value: 20,
            min: 5,
            max: 100,
            step: 1,
            label: "Hauteur interne (Y)",
          },
          d: {
            value: 80,
            min: 5,
            max: 100,
            step: 1,
            label: "Profondeur interne (Z)",
          },
        },
        { collapsed: true },
      ),
    },
  );
  // =========================================================================

  // Fonction de détection qui prend le nom du mur en paramètre
  const handleKillZoneHit = (boundaryName: string) => (e: any) => {
    if (e.other.rigidBodyObject?.name === "ball") {
      console.warn(
        `⚠️ ALERTE GLITCH : La bille a quitté le plateau via le RigidBody : [${boundaryName}]`,
      );
      const ballId = e.other.rigidBodyObject.userData?.id;
      // On déclenche la perte de la bille
      loseBall(ballId);
    }
  };

  // Épaisseur de chaque boîte capteur
  const t = 1;

  return (
    <group name="kill_zone" position={[cx, cy, cz]}>
      {/* 1. SOL */}
      <RigidBody
        type="fixed"
        colliders={false}
        sensor
        onIntersectionEnter={handleKillZoneHit("SOL")}
      >
        <CuboidCollider
          args={[w / 2 + t * 2, t, d / 2 + t * 2]}
          position={[0, -h / 2 - t, 0]}
        />
      </RigidBody>

      {/*2. PLAFOND */}
      <RigidBody
        type="fixed"
        colliders={false}
        sensor
        onIntersectionEnter={handleKillZoneHit("PLAFOND")}
      >
        <CuboidCollider
          args={[w / 2 + t * 2, t, d / 2 + t * 2]}
          position={[0, h / 2 + t, 0]}
        />
      </RigidBody>

      {/* MUR GAUCHE */}
      <RigidBody
        type="fixed"
        colliders={false}
        sensor
        onIntersectionEnter={handleKillZoneHit("MUR_GAUCHE")}
      >
        <CuboidCollider
          args={[t, h / 2, d / 2]}
          position={[-w / 2 - t, 0, 0]}
        />
      </RigidBody>

      {/* MUR DROIT */}
      <RigidBody
        type="fixed"
        colliders={false}
        sensor
        onIntersectionEnter={handleKillZoneHit("MUR_DROIT")}
      >
        <CuboidCollider args={[t, h / 2, d / 2]} position={[w / 2 + t, 0, 0]} />
      </RigidBody>

      {/* MUR AVANT */}
      <RigidBody
        type="fixed"
        colliders={false}
        sensor
        onIntersectionEnter={handleKillZoneHit("MUR_AVANT")}
      >
        <CuboidCollider args={[w / 2, h / 2, t]} position={[0, 0, d / 2 + t]} />
      </RigidBody>

      {/* MUR ARRIÈRE */}
      <RigidBody
        type="fixed"
        colliders={false}
        sensor
        onIntersectionEnter={handleKillZoneHit("MUR_ARRIERE")}
      >
        <CuboidCollider
          args={[w / 2, h / 2, t]}
          position={[0, 0, -d / 2 - t]}
        />
      </RigidBody>

      {/* VISUEL DE DEBUG */}
      {debugZone && (
        <mesh>
          <boxGeometry args={[w, h, d]} />
          <meshBasicMaterial
            color="red"
            wireframe={true}
            transparent
            opacity={0.4}
          />
        </mesh>
      )}
    </group>
  );
}

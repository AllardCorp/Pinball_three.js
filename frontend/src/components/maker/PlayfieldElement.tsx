import { useMemo } from "react";
import { PivotControls } from "@react-three/drei";
import * as THREE from "three";
import { getMakerElementConfig } from "@/config/makerElementConfig";
import { type MakerElement, useMakerStore } from "@/store/useMakerStore";
import { ElementGeometry } from "./ElementGeometry";

/**
 * Fonction raycast no-op : retourne toujours null (aucune intersection).
 *
 * Pourquoi ? PivotControls dessine ses flèches avec `depthTest={false}`,
 * ce qui les rend VISUELLEMENT visibles à travers les mesh enfants.
 * Mais le raycaster de R3F ignore le rendu GPU — il fait un calcul
 * géométrique pur. Résultat : le mesh (cylindre, cube…) est plus proche
 * géométriquement → il intercepte le clic AVANT la flèche du gizmo.
 *
 * En remplaçant la méthode `raycast` du mesh par ce no-op, le mesh
 * reste affiché normalement mais devient invisible au raycaster.
 * Seules les flèches du gizmo captent alors les événements pointeur.
 */
const noopRaycast = () => null;

// Interface définissant la structure attendue par le composant de l'obstacle.
interface PlayfieldElementProps {
  element: MakerElement;
}

// Composant gérant l'affichage 3D d'un élément, sa sélection et son outil de déplacement.
export function PlayfieldElement({ element }: PlayfieldElementProps) {
  const selectedElementId = useMakerStore((state) => state.selectedElementId);
  const setSelectedElementId = useMakerStore((state) => state.setSelectedElementId);
  const updateElementTransform = useMakerStore((state) => state.updateElementTransform);

  const isSelected = selectedElementId === element.id;

  // Construit la matrice de transformation à partir de position/rotation/scale.
  // PivotControls utilise cette matrice pour positionner le gizmo.
  const matrix = useMemo(() => {
    const m = new THREE.Matrix4();
    m.compose(
      new THREE.Vector3(...element.position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...element.rotation)),
      new THREE.Vector3(...element.scale)
    );
    return m;
  }, [element.position, element.rotation, element.scale]);

  // Extrait les coordonnées spatiales de la matrice du Gizmo pour mettre à jour le store Zustand.
  const handleDrag = (localMatrix: THREE.Matrix4) => {
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const sc = new THREE.Vector3();
    localMatrix.decompose(pos, quat, sc);
    const rot = new THREE.Euler().setFromQuaternion(quat);

    updateElementTransform(
      element.id,
      [pos.x, pos.y, pos.z],
      [rot.x, rot.y, rot.z],
      [sc.x, sc.y, sc.z]
    );
  };

  // Gère la sélection de l'élément au clic et bloque la propagation pour éviter les bugs R3F.
  const handleClick = (e: THREE.Event & MouseEvent) => {
    e.stopPropagation();
    setSelectedElementId(element.id);
  };

  // Génère la forme 3D et le matériau PBR (couleur, rugosité, métal) de l'élément.
  const renderGeometry = (disableRaycast = false) => {
    const config = getMakerElementConfig(element.type);
    // Type inconnu (niveau sauvegardé par une version plus récente du Maker) :
    // on ne rend rien plutôt que de planter le Canvas.
    if (!config) return null;

    const raycast = disableRaycast ? noopRaycast : undefined;
    const color = isSelected ? config.selectedColor : (element.color ?? config.defaults.color);

    return (
      <mesh castShadow receiveShadow raycast={raycast}>
        <ElementGeometry type={element.type} />
        <meshStandardMaterial
          color={color}
          roughness={element.roughness ?? config.defaults.roughness}
          metalness={element.metalness ?? config.defaults.metalness}
        />
      </mesh>
    );
  };

  // ─── Élément sélectionné : on affiche le gizmo PivotControls ───────────────
  if (isSelected) {
    return (
      <PivotControls
        matrix={matrix}
        autoTransform={false}
        onDrag={handleDrag}
        anchor={[0, 0, 0]}
        depthTest={false}
        fixed
        scale={75}
        disableSliders={true}
        activeAxes={[true, true, true]}
      >
        {/* disableRaycast=true → le mesh ne vole plus les clics aux flèches */}
        <group onClick={handleClick}>
          {renderGeometry(true)}
        </group>
      </PivotControls>
    );
  }

  // ─── Élément non sélectionné : mesh cliquable pour la sélection ────────────
  return (
    <group
      position={element.position}
      rotation={element.rotation}
      scale={element.scale}
      onClick={handleClick}
    >
      {renderGeometry()}
    </group>
  );
}

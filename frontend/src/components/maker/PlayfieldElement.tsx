import { useMemo } from "react";
import { PivotControls } from "@react-three/drei";
import * as THREE from "three";
import { MakerElement, useMakerStore } from "@/store/useMakerStore";

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

interface PlayfieldElementProps {
  element: MakerElement;
}

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

  // Callback appelé à chaque frame de drag du gizmo.
  // Décompose la matrice locale en position/rotation/scale
  // et met à jour le store Zustand.
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

  // Sélection de l'élément au clic complet (pointerDown + pointerUp).
  // stopPropagation empêche le clic de se propager au Canvas
  // (sinon onPointerMissed du Canvas désélectionnerait immédiatement).
  const handleClick = (e: THREE.Event & MouseEvent) => {
    e.stopPropagation();
    setSelectedElementId(element.id);
  };

  /**
   * Rendu de la géométrie de prévisualisation selon le type d'élément.
   *
   * @param disableRaycast — si true, le mesh ne réagit plus au raycaster.
   *   Activé quand l'élément est sélectionné (= PivotControls actif) pour
   *   éviter que le mesh intercepte les clics destinés aux flèches du gizmo.
   *   Désactivé quand l'élément n'est pas sélectionné, pour permettre
   *   la sélection au clic.
   */
  const renderGeometry = (disableRaycast = false) => {
    const raycast = disableRaycast ? noopRaycast : undefined;
    switch (element.type) {
      case "cylinder":
        return (
          <mesh castShadow receiveShadow raycast={raycast}>
            <cylinderGeometry args={[1.5, 1.5, 1, 32]} />
            <meshStandardMaterial
              color={isSelected ? "#ea580c" : (element.color || "#3b82f6")}
              roughness={element.roughness !== undefined ? element.roughness : 0.2}
              metalness={element.metalness !== undefined ? element.metalness : 0.8}
            />
          </mesh>
        );
      case "box":
        return (
          <mesh castShadow receiveShadow raycast={raycast}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial
              color={isSelected ? "#ea580c" : (element.color || "#ef4444")}
              roughness={element.roughness !== undefined ? element.roughness : 0.2}
              metalness={element.metalness !== undefined ? element.metalness : 0.8}
            />
          </mesh>
        );
      case "sphere":
        return (
          <mesh castShadow receiveShadow raycast={raycast}>
            <sphereGeometry args={[1.2, 32, 32]} />
            <meshStandardMaterial
              color={isSelected ? "#ea580c" : (element.color || "#10b981")}
              roughness={element.roughness !== undefined ? element.roughness : 0.2}
              metalness={element.metalness !== undefined ? element.metalness : 0.8}
            />
          </mesh>
        );
    }
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

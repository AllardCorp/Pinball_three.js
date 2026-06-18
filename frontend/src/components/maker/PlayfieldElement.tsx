import { useMemo } from "react";
import { PivotControls } from "@react-three/drei";
import * as THREE from "three";
import { MakerElement, useMakerStore } from "@/store/useMakerStore";

interface PlayfieldElementProps {
  element: MakerElement;
}

export function PlayfieldElement({ element }: PlayfieldElementProps) {
  const selectedElementId = useMakerStore((state) => state.selectedElementId);
  const setSelectedElementId = useMakerStore((state) => state.setSelectedElementId);
  const updateElementTransform = useMakerStore((state) => state.updateElementTransform);

  const isSelected = selectedElementId === element.id;

  // Build matrix for PivotControls from position, rotation, scale
  const matrix = useMemo(() => {
    const m = new THREE.Matrix4();
    m.compose(
      new THREE.Vector3(...element.position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...element.rotation)),
      new THREE.Vector3(...element.scale)
    );
    return m;
  }, [element.position, element.rotation, element.scale]);

  const handleDrag = (localMatrix: THREE.Matrix4) => {
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const sc = new THREE.Vector3();
    localMatrix.decompose(pos, quat, sc);
    const rot = new THREE.Euler().setFromQuaternion(quat);

    // Bloquer la hauteur (axe Y) pour qu'elle ne bouge pas à la souris
    pos.y = element.position[1];

    updateElementTransform(
      element.id,
      [pos.x, pos.y, pos.z],
      [rot.x, rot.y, rot.z],
      [sc.x, sc.y, sc.z]
    );
  };

  const handlePointerDown = (e: THREE.Event & PointerEvent) => {
    e.stopPropagation();
    setSelectedElementId(element.id);
  };

  const renderGeometry = () => {
    switch (element.type) {
      case "cylinder":
        return (
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[1.5, 1.5, 1, 32]} />
            <meshStandardMaterial
              color={isSelected ? "#ea580c" : "#3b82f6"}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        );
      case "box":
        return (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial
              color={isSelected ? "#ea580c" : "#ef4444"}
              roughness={0.4}
              metalness={0.1}
            />
          </mesh>
        );
      case "sphere":
        return (
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[1.2, 32, 32]} />
            <meshStandardMaterial
              color={isSelected ? "#ea580c" : "#10b981"}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
        );
    }
  };

  const meshContent = renderGeometry();

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
        disableSliders={true} // Masque les carrés (déplacement diagonal)
        activeAxes={[true, false, true]} // Masque la flèche verte (Axe Y)
      >
        {/* On ne remet pas position/rotation/scale ici car PivotControls s'en charge via la prop 'matrix' */}
        <group onPointerDown={handlePointerDown}>
          {meshContent}
        </group>
      </PivotControls>
    );
  }

  return (
    <group
      position={element.position}
      rotation={element.rotation}
      scale={element.scale}
      onPointerDown={handlePointerDown}
    >
      {meshContent}
    </group>
  );
}

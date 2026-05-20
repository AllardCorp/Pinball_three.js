import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";

const MODEL_PATH = "/models/PinballMVP_Base-transformed.glb";

export default function PinballMVPBase(props: ThreeElements["group"]) {
  const { scene } = useGLTF(MODEL_PATH);

  return (
    <group {...props}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);

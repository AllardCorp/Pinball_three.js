import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { PinballMVPMaker } from "@/components/models/PinballMVP_Maker";
import { useMakerStore } from "@/store/useMakerStore";
import type { MakerElement } from "@/store/useMakerStore";
import { PlayfieldElement } from "./PlayfieldElement";
import { ScreenshotCapture } from "./ScreenshotCapture";

interface EditorCanvasProps {
  elements: MakerElement[];
  onScreenshotReady: (fn: () => string) => void;
}

// Composant configurant la scène 3D (Canvas WebGL, caméra, lumières, contrôles) et listant les obstacles.
export function EditorCanvas({ elements, onScreenshotReady }: EditorCanvasProps) {
  const setSelectedElementId = useMakerStore((state) => state.setSelectedElementId);

  return (
    <div className="flex-1 relative">
      <Canvas
        camera={{ position: [0.2, 56.7, 29.5], fov: 45 }}
        onPointerMissed={() => setSelectedElementId(null)}
        shadows
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 30, 20]} intensity={2} castShadow />
        <Environment preset="city" />

        <Suspense fallback={null}>
          <PinballMVPMaker />
        </Suspense>

        {elements.map((el) => (
          <PlayfieldElement key={el.id} element={el} />
        ))}

        <ScreenshotCapture onReady={onScreenshotReady} />

        <OrbitControls target={[0.5, -5.0, 4.7]} makeDefault />
      </Canvas>
    </div>
  );
}

import { useEffect, useState, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Environment } from "@react-three/drei";

import { PinballMVPMaker } from "@/components/models/PinballMVP_Maker";
import { PhysicsPlayfieldElement } from "@/components/maker/PhysicsPlayfieldElement";
import Ball from "@/components/Ball";
import { apiEndpoint } from "@/lib/api";
import type { MakerElement } from "@/store/useMakerStore";
import { useGameStore } from "@/store/useGameStore";
import { useKeyboardControls } from "@/mqtt/useKeyboardControls";

function FixedCamera() {
  useFrame(({ camera }) => {
    camera.position.set(0.2, 56.7, 29.5);
    camera.lookAt(0.5, -5.0, 4.7);
  });
  return null;
}

function Scene({ elements }: { elements: MakerElement[] }) {
  const startGame = useGameStore((state) => state.startGame);
  const isPlaying = useGameStore((state) => state.isPlaying);

  useEffect(() => {
    if (!isPlaying) startGame(1);
  }, [isPlaying, startGame]);

  return (
    <Suspense fallback={null}>
      <PinballMVPMaker />
      {elements.map((el) => (
        <PhysicsPlayfieldElement key={el.id} element={el} />
      ))}
      <Ball position={[12.75, -2.3, 30.46]} />
    </Suspense>
  );
}

export default function PlayfieldMaker() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const [elements, setElements] = useState<MakerElement[]>([]);

  useKeyboardControls();

  useEffect(() => {
    if (!levelId) { navigate("/maker"); return; }
    fetch(apiEndpoint(`/api/levels/${levelId}`))
      .then((r) => r.json())
      .then((data) => setElements(Array.isArray(data.elements) ? data.elements : []))
      .catch(console.error);
  }, [levelId, navigate]);

  return (
    <div className="relative h-screen w-screen">
      <Canvas dpr={1} shadows camera={{ position: [0.2, 56.7, 29.5], fov: 45 }}>
        <color attach="background" args={["#111"]} />
        <Environment preset="city" />
        <Physics gravity={[0, -80, 20]}>
          <FixedCamera />
          <Scene elements={elements} />
        </Physics>
      </Canvas>
    </div>
  );
}

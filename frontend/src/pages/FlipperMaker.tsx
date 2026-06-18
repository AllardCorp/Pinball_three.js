import { useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { useSession } from "@/lib/auth-client";
import { PinballMVPMaker } from "@/components/models/PinballMVP_Maker";
import { useMakerStore, MakerElement } from "@/store/useMakerStore";
import { PlayfieldElement } from "@/components/maker/PlayfieldElement";

// Helper functions for degrees conversion
const radToDeg = (rad: number) => Math.round((rad * 180) / Math.PI);
const degToRad = (deg: number) => (deg * Math.PI) / 180;

// ─── Vue liste des niveaux ───────────────────────────────────────────────────

function LevelList({ onCreate }: { onCreate: () => void }) {
  const { data: session } = useSession();
  const navigate = useNavigate();

  const handleCreate = () => {
    // TODO: réactiver l'auth quand le backend sera opérationnel
    // if (!session) {
    //   navigate("/login?redirect=/maker");
    //   return;
    // }
    onCreate();
  };

  // TODO : remplacer par les vraies données de l'API
  const levels: { id: number; name: string; author: string }[] = [];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Flipper Maker</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Crée et partage tes propres niveaux de flipper
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-orange-500 hover:bg-orange-400 transition-colors text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          Créer un niveau
        </button>
      </header>

      {/* Contenu */}
      <main className="flex-1 px-8 py-10">
        {levels.length === 0 ? (
          // État vide
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-32">
            <div className="text-6xl">🎰</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-200">
                Aucun niveau pour l'instant
              </h2>
              <p className="text-gray-500 mt-2 max-w-sm">
                Sois le premier à créer un niveau personnalisé et à le partager
                avec la communauté !
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-orange-500 hover:bg-orange-400 transition-colors text-white font-semibold px-8 py-3 rounded-lg"
            >
              Créer mon premier niveau
            </button>
          </div>
        ) : (
          // Liste des niveaux
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.map((level) => (
              <div
                key={level.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-orange-500 transition-colors cursor-pointer"
              >
                <h3 className="font-semibold text-white">{level.name}</h3>
                <p className="text-gray-400 text-sm mt-1">par {level.author}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Vue éditeur 3D ──────────────────────────────────────────────────────────

function Editor({ onBack }: { onBack: () => void }) {
  const elements = useMakerStore((state) => state.elements);
  const addElement = useMakerStore((state) => state.addElement);
  const removeElement = useMakerStore((state) => state.removeElement);
  const selectedElementId = useMakerStore((state) => state.selectedElementId);
  const setSelectedElementId = useMakerStore((state) => state.setSelectedElementId);
  const updateElementTransform = useMakerStore((state) => state.updateElementTransform);

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // Handlers for modifying coordinates directly from the inspector inputs
  const updatePosition = (axis: number, val: number) => {
    if (!selectedElement) return;
    const pos = [...selectedElement.position] as [number, number, number];
    pos[axis] = val;
    updateElementTransform(selectedElement.id, pos, selectedElement.rotation, selectedElement.scale);
  };

  const updateRotation = (axis: number, valDeg: number) => {
    if (!selectedElement) return;
    const rot = [...selectedElement.rotation] as [number, number, number];
    rot[axis] = degToRad(valDeg);
    updateElementTransform(selectedElement.id, selectedElement.position, rot, selectedElement.scale);
  };

  const updateScale = (axis: number, val: number) => {
    if (!selectedElement) return;
    const sc = [...selectedElement.scale] as [number, number, number];
    sc[axis] = val;
    updateElementTransform(selectedElement.id, selectedElement.position, selectedElement.rotation, sc);
  };

  return (
    <div className="w-screen h-screen bg-gray-950 flex overflow-hidden font-sans text-white">
      {/* ─── PANNEAU GAUCHE : Palette ─── */}
      <div className="w-72 border-r border-gray-800 bg-gray-900/40 p-6 flex flex-col gap-6 select-none">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white flex items-center gap-2 mb-2 text-sm transition-colors cursor-pointer"
        >
          <span>←</span> Retour à la liste
        </button>

        <div>
          <h2 className="text-xl font-bold text-white mb-1">Palette</h2>
          <p className="text-xs text-gray-400 mb-6">Ajouter des éléments en 0, 0</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => addElement("cylinder")}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>🔵 Bumper (Cylindre)</span>
              <span className="text-xs opacity-60">Ajouter</span>
            </button>

            <button
              onClick={() => addElement("box")}
              className="bg-red-600 hover:bg-red-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>🟥 Mur (Cube)</span>
              <span className="text-xs opacity-60">Ajouter</span>
            </button>

            <button
              onClick={() => addElement("sphere")}
              className="bg-green-600 hover:bg-green-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>🟢 Target (Sphère)</span>
              <span className="text-xs opacity-60">Ajouter</span>
            </button>
          </div>
        </div>

        {/* Aide simplifiée */}
        <div className="mt-auto bg-gray-900/60 border border-gray-800 p-4 rounded-xl">
          <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Navigation</h4>
          <ul className="text-xs text-gray-400 space-y-1.5 list-disc pl-4">
            <li>Clic gauche + glisser pour pivoter la caméra</li>
            <li>Clic droit + glisser pour déplacer</li>
            <li>Molette pour zoomer</li>
            <li>Cliquez sur un objet pour faire apparaître le gizmo de contrôle</li>
          </ul>
        </div>
      </div>

      {/* ─── ESPACE CENTRAL : Vue 3D ─── */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 60, 40], fov: 45 }}
          onPointerMissed={() => setSelectedElementId(null)}
          shadows
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 30, 20]} intensity={2} castShadow />
          <Environment preset="city" />

          <Suspense fallback={null}>
            <PinballMVPMaker position={[0, 2.903, 0]} />
          </Suspense>

          {/* Éléments créés */}
          {elements.map((el) => (
            <PlayfieldElement key={el.id} element={el} />
          ))}

          <OrbitControls target={[0, -2, 7]} makeDefault />
        </Canvas>
      </div>

      {/* ─── PANNEAU DROIT : Inspecteur ─── */}
      <div className="w-80 border-l border-gray-800 bg-gray-900/40 p-6 flex flex-col select-none">
        <h2 className="text-xl font-bold text-white mb-6">Inspecteur</h2>

        {selectedElement ? (
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
            {/* Infos de base */}
            <div className="border-b border-gray-800 pb-4">
              <div className="text-xs uppercase text-gray-400 tracking-wider font-semibold">Type: {selectedElement.type}</div>
              <h3 className="text-lg font-bold text-orange-400 mt-1">{selectedElement.name}</h3>
            </div>

            {/* Position */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Position</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold">X</label>
                  <input
                    type="number"
                    step="0.1"
                    value={Number(selectedElement.position[0].toFixed(2))}
                    onChange={(e) => updatePosition(0, parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Y</label>
                  <input
                    type="number"
                    step="0.1"
                    value={Number(selectedElement.position[1].toFixed(2))}
                    onChange={(e) => updatePosition(1, parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Z</label>
                  <input
                    type="number"
                    step="0.1"
                    value={Number(selectedElement.position[2].toFixed(2))}
                    onChange={(e) => updatePosition(2, parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Rotation (Degrés)</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold">X</label>
                  <input
                    type="number"
                    step="1"
                    value={radToDeg(selectedElement.rotation[0])}
                    onChange={(e) => updateRotation(0, parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Y</label>
                  <input
                    type="number"
                    step="1"
                    value={radToDeg(selectedElement.rotation[1])}
                    onChange={(e) => updateRotation(1, parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Z</label>
                  <input
                    type="number"
                    step="1"
                    value={radToDeg(selectedElement.rotation[2])}
                    onChange={(e) => updateRotation(2, parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Echelle (Scale) */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Scale</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold">X</label>
                  <input
                    type="number"
                    step="0.1"
                    value={Number(selectedElement.scale[0].toFixed(2))}
                    onChange={(e) => updateScale(0, parseFloat(e.target.value) || 1)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Y</label>
                  <input
                    type="number"
                    step="0.1"
                    value={Number(selectedElement.scale[1].toFixed(2))}
                    onChange={(e) => updateScale(1, parseFloat(e.target.value) || 1)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Z</label>
                  <input
                    type="number"
                    step="0.1"
                    value={Number(selectedElement.scale[2].toFixed(2))}
                    onChange={(e) => updateScale(2, parseFloat(e.target.value) || 1)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="mt-auto pt-6 border-t border-gray-800">
              <button
                onClick={() => removeElement(selectedElement.id)}
                className="w-full bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 text-red-400 font-semibold py-3 rounded-xl transition-all cursor-pointer text-center text-sm"
              >
                Supprimer l'élément
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 text-sm gap-2">
            <span className="text-3xl">👈</span>
            <p>Aucun élément sélectionné</p>
            <p className="text-xs text-gray-600 max-w-[180px]">Cliquez sur un élément en 3D ou ajoutez-en un pour commencer.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function FlipperMaker() {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return <Editor onBack={() => setIsEditing(false)} />;
  }

  return <LevelList onCreate={() => setIsEditing(true)} />;
}

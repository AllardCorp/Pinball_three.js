import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { PinballMVPMaker } from "@/components/models/PinballMVP_Maker";
import { useMakerStore, type LevelListItem } from "@/store/useMakerStore";
import { PlayfieldElement } from "@/components/maker/PlayfieldElement";
import { apiEndpoint } from "@/lib/api";

(window as any).__maker = useMakerStore;

// Helper functions for degrees conversion
const radToDeg = (rad: number) => Math.round((rad * 180) / Math.PI);
const degToRad = (deg: number) => (deg * Math.PI) / 180;

// ─── Capture screenshot à résolution fixe (indépendant de l'écran) ───────────

const SCREENSHOT_W = 300;
const SCREENSHOT_H = 480;

function ScreenshotCapture({ onReady }: { onReady: (fn: () => string) => void }) {
  const { gl, scene } = useThree();

  useEffect(() => {
    onReady(() => {
      // Caméra dédiée calibrée pour cadrer le plateau, ratio portrait
      const cam = new THREE.PerspectiveCamera(45, SCREENSHOT_W / SCREENSHOT_H, 0.1, 1000);
      cam.position.set(0.2, 70, 15);
      cam.lookAt(0.5, -5.0, 10);

      // Rendu dans une texture à résolution fixe, pas liée à l'écran
      const target = new THREE.WebGLRenderTarget(SCREENSHOT_W, SCREENSHOT_H);
      gl.setRenderTarget(target);
      gl.render(scene, cam);
      gl.setRenderTarget(null);

      // Lecture des pixels — WebGL est Y-inversé, on flip verticalement
      const pixels = new Uint8Array(SCREENSHOT_W * SCREENSHOT_H * 4);
      gl.readRenderTargetPixels(target, 0, 0, SCREENSHOT_W, SCREENSHOT_H, pixels);
      target.dispose();

      const canvas = document.createElement("canvas");
      canvas.width = SCREENSHOT_W;
      canvas.height = SCREENSHOT_H;
      const ctx = canvas.getContext("2d")!;
      const imageData = ctx.createImageData(SCREENSHOT_W, SCREENSHOT_H);

      for (let y = 0; y < SCREENSHOT_H; y++) {
        for (let x = 0; x < SCREENSHOT_W; x++) {
          const src = ((SCREENSHOT_H - 1 - y) * SCREENSHOT_W + x) * 4;
          const dst = (y * SCREENSHOT_W + x) * 4;
          imageData.data[dst]     = pixels[src];
          imageData.data[dst + 1] = pixels[src + 1];
          imageData.data[dst + 2] = pixels[src + 2];
          imageData.data[dst + 3] = pixels[src + 3];
        }
      }

      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL("image/jpeg", 0.85);
    });
  }, [gl, scene, onReady]);

  return null;
}

// ─── Vue liste des niveaux ───────────────────────────────────────────────────

function LevelList({ onCreate }: { onCreate: () => void }) {
  const navigate = useNavigate();
  const resetLevel = useMakerStore((state) => state.resetLevel);

  const [levels, setLevels] = useState<LevelListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiEndpoint("/api/levels"))
      .then((r) => r.json())
      .then((data) => setLevels(Array.isArray(data) ? data : []))
      .catch(() => setLevels([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = () => {
    resetLevel();
    onCreate();
  };

  const handlePlay = (id: string) => {
    navigate(`/playfield/${id}`);
  };

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
        {loading ? (
          <div className="flex items-center justify-center py-32 text-gray-500">
            Chargement…
          </div>
        ) : levels.length === 0 ? (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.map((level) => (
              <div
                key={level.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-orange-500 transition-colors"
              >
                {/* Miniature screenshot */}
                <div className="w-full aspect-video bg-gray-800 flex items-center justify-center overflow-hidden">
                  {level.screenshotUrl ? (
                    <img
                      src={apiEndpoint(level.screenshotUrl!)}
                      alt={level.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 text-sm">Pas de preview</span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-white">{level.name}</h3>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(level.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handlePlay(level.id)}
                      className="flex-1 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Jouer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Vue éditeur 3D ──────────────────────────────────────────────────────────

type SaveStatus = "idle" | "saving" | "saved" | "error";

function Editor({ onBack }: { onBack: () => void }) {
  const elements = useMakerStore((state) => state.elements);
  const addElement = useMakerStore((state) => state.addElement);
  const removeElement = useMakerStore((state) => state.removeElement);
  const selectedElementId = useMakerStore((state) => state.selectedElementId);
  const setSelectedElementId = useMakerStore((state) => state.setSelectedElementId);
  const updateElementTransform = useMakerStore((state) => state.updateElementTransform);
  const updateElementProperties = useMakerStore((state) => state.updateElementProperties);
  const levelName = useMakerStore((state) => state.levelName);
  const setLevelName = useMakerStore((state) => state.setLevelName);

  const selectedElement = elements.find((el) => el.id === selectedElementId);
  const captureRef = useRef<(() => string) | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const handleScreenshotReady = useCallback((fn: () => string) => {
    captureRef.current = fn;
  }, []);

  const handleSave = async () => {
    if (!levelName.trim()) return;
    setSaveStatus("saving");

    try {
      const screenshot = captureRef.current?.() ?? null;
      const res = await fetch(apiEndpoint("/api/levels"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: levelName, elements, screenshot }),
      });

      if (!res.ok) throw new Error("save_failed");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

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

        {/* Nom du niveau + bouton save */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Nom du niveau
          </label>
          <input
            type="text"
            value={levelName}
            onChange={(e) => setLevelName(e.target.value)}
            placeholder="Mon niveau"
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving" || !levelName.trim()}
            className={`w-full font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer
              ${saveStatus === "saved"
                ? "bg-green-600 text-white"
                : saveStatus === "error"
                  ? "bg-red-700 text-white"
                  : "bg-orange-500 hover:bg-orange-400 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
          >
            {saveStatus === "saving"
              ? "Sauvegarde…"
              : saveStatus === "saved"
                ? "✓ Sauvegardé !"
                : saveStatus === "error"
                  ? "Erreur, réessayer"
                  : "Sauvegarder"}
          </button>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-1">Palette</h2>
          <p className="text-xs text-gray-400 mb-6">Ajouter des éléments en 0, 0</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => addElement("cylinder")}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>🔵 Cylindre</span>
              <span className="text-xs opacity-60">Ajouter</span>
            </button>

            <button
              onClick={() => addElement("box")}
              className="bg-red-600 hover:bg-red-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>🟥 Cube</span>
              <span className="text-xs opacity-60">Ajouter</span>
            </button>

            <button
              onClick={() => addElement("sphere")}
              className="bg-green-600 hover:bg-green-500 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>🟢 Sphère</span>
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

          <ScreenshotCapture onReady={handleScreenshotReady} />

          <OrbitControls target={[0.5, -5.0, 4.7]} makeDefault />
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
                {(["X", "Y", "Z"] as const).map((axis, i) => (
                  <div key={axis}>
                    <label className="text-[10px] text-gray-500 uppercase font-bold">{axis}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={Number(selectedElement.position[i].toFixed(2))}
                      onChange={(e) => updatePosition(i, parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-center focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Rotation */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Rotation (Degrés)</h4>
              <div className="grid grid-cols-3 gap-2">
                {(["X", "Y", "Z"] as const).map((axis, i) => (
                  <div key={axis}>
                    <label className="text-[10px] text-gray-500 uppercase font-bold">{axis}</label>
                    <input
                      type="number"
                      step="1"
                      value={radToDeg(selectedElement.rotation[i])}
                      onChange={(e) => updateRotation(i, parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-center focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Scale */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Scale</h4>
              <div className="grid grid-cols-3 gap-2">
                {(["X", "Y", "Z"] as const).map((axis, i) => (
                  <div key={axis}>
                    <label className="text-[10px] text-gray-500 uppercase font-bold">{axis}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={Number(selectedElement.scale[i].toFixed(2))}
                      onChange={(e) => updateScale(i, parseFloat(e.target.value) || 1)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-center focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Couleur */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Couleur</h4>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={selectedElement.color || "#ffffff"}
                  onChange={(e) => updateElementProperties(selectedElement.id, { color: e.target.value })}
                  className="w-10 h-10 bg-transparent border-0 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedElement.color || "#ffffff"}
                  onChange={(e) => updateElementProperties(selectedElement.id, { color: e.target.value })}
                  className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-2 text-sm text-center focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Aspect visuel */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-semibold text-gray-300">Aspect visuel</h4>

              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Fini de surface (Mat / Brillant)</span>
                  <span>{Math.round((1 - (selectedElement.roughness ?? 0.5)) * 100)}% brillant</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={selectedElement.roughness ?? 0.5}
                  onChange={(e) => updateElementProperties(selectedElement.id, { roughness: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Matériau (Plastique / Métal)</span>
                  <span>{Math.round((selectedElement.metalness ?? 0.5) * 100)}% métal</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={selectedElement.metalness ?? 0.5}
                  onChange={(e) => updateElementProperties(selectedElement.id, { metalness: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Physique */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Effet physique</h4>
              <label className="flex items-center gap-3 cursor-pointer mb-3 select-none">
                <input
                  type="checkbox"
                  checked={!!selectedElement.isBumper}
                  onChange={(e) => updateElementProperties(selectedElement.id, { isBumper: e.target.checked })}
                  className="w-4 h-4 bg-gray-900 border border-gray-800 rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
                <span className="text-sm text-gray-300">Activer l'effet rebond</span>
              </label>

              {selectedElement.isBumper && (
                <div className="mt-2 pl-4 border-l border-blue-500/50">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Force de propulsion</span>
                    <span>{selectedElement.bumpStrength ?? 15}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="0.5"
                    value={selectedElement.bumpStrength ?? 15}
                    onChange={(e) => updateElementProperties(selectedElement.id, { bumpStrength: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
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

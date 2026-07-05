import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAppMode } from "@/hooks/useAppMode";
import { apiEndpoint } from "@/lib/api";
import { useMakerStore } from "@/store/useMakerStore";
import { EditorCanvas } from "@/components/maker/EditorCanvas";
import { Inspector } from "@/components/maker/Inspector";
import { MakerPalette } from "@/components/maker/MakerPalette";

type SaveStatus = "idle" | "saving" | "saved" | "error" | "forbidden";

interface MakerEditorPageProps {
  mode: "create" | "edit";
}

const SAVE_STATUS_LABEL: Record<Exclude<SaveStatus, "idle">, string> = {
  saving: "Sauvegarde…",
  saved: "✓ Sauvegardé !",
  error: "Erreur, réessayer",
  forbidden: "Vous ne pouvez modifier que vos propres niveaux",
};

export default function MakerEditorPage({ mode }: MakerEditorPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { withMode } = useAppMode();

  const elements = useMakerStore((state) => state.elements);
  const addElement = useMakerStore((state) => state.addElement);
  const removeElement = useMakerStore((state) => state.removeElement);
  const selectedElementId = useMakerStore((state) => state.selectedElementId);
  const updateElementTransform = useMakerStore((state) => state.updateElementTransform);
  const updateElementProperties = useMakerStore((state) => state.updateElementProperties);
  const levelName = useMakerStore((state) => state.levelName);
  const setLevelName = useMakerStore((state) => state.setLevelName);
  const levelId = useMakerStore((state) => state.levelId);
  const setLevelId = useMakerStore((state) => state.setLevelId);
  const loadLevel = useMakerStore((state) => state.loadLevel);
  const resetLevel = useMakerStore((state) => state.resetLevel);

  const selectedElement = elements.find((el) => el.id === selectedElementId) ?? null;
  const captureRef = useRef<(() => string) | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isLoadingLevel, setIsLoadingLevel] = useState(mode === "edit");

  useEffect(() => {
    if (mode === "create") {
      resetLevel();
      return;
    }

    if (!id) {
      navigate("/maker");
      return;
    }

    let cancelled = false;
    setIsLoadingLevel(true);

    fetch(apiEndpoint(`/api/levels/${id}`), { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error("level_not_found");
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        // Défense en profondeur : le backend refuse déjà toute sauvegarde
        // sur un niveau qui n'appartient pas à l'utilisateur connecté, mais
        // inutile d'afficher un éditeur pour un niveau qu'il ne pourra pas
        // enregistrer.
        if (!data.isOwner) {
          navigate("/maker");
          return;
        }
        loadLevel(data);
      })
      .catch(() => {
        if (!cancelled) navigate("/maker");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingLevel(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, id]);

  const handleScreenshotReady = useCallback((fn: () => string) => {
    captureRef.current = fn;
  }, []);

  const handleSave = async () => {
    if (!levelName.trim()) return;
    setSaveStatus("saving");

    try {
      const screenshot = captureRef.current?.() ?? null;
      const method = levelId ? "PUT" : "POST";
      const url = levelId ? `/api/levels/${levelId}` : "/api/levels";

      const res = await fetch(apiEndpoint(url), {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: levelName, elements, screenshot }),
      });

      if (res.status === 401) {
        const redirectTo = withMode(`${location.pathname}${location.search}`);
        navigate(withMode(`/login?redirect=${encodeURIComponent(redirectTo)}`));
        return;
      }

      if (res.status === 403) {
        setSaveStatus("forbidden");
        setTimeout(() => setSaveStatus("idle"), 3000);
        return;
      }

      if (!res.ok) throw new Error("save_failed");

      if (!levelId) {
        const created = await res.json();
        setLevelId(created.id);
      }

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
    rot[axis] = (valDeg * Math.PI) / 180;
    updateElementTransform(selectedElement.id, selectedElement.position, rot, selectedElement.scale);
  };

  const updateScale = (axis: number, val: number) => {
    if (!selectedElement) return;
    const sc = [...selectedElement.scale] as [number, number, number];
    sc[axis] = val;
    updateElementTransform(selectedElement.id, selectedElement.position, selectedElement.rotation, sc);
  };

  if (isLoadingLevel) {
    return (
      <div className="w-screen h-screen bg-gray-950 flex items-center justify-center text-gray-500 text-sm">
        Chargement du niveau…
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-gray-950 flex overflow-hidden font-sans text-white">
      {/* ─── PANNEAU GAUCHE : Palette ─── */}
      <div className="w-72 border-r border-gray-800 bg-gray-900/40 p-6 flex flex-col gap-6 select-none">
        <button
          onClick={() => navigate("/maker")}
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
                : saveStatus === "error" || saveStatus === "forbidden"
                  ? "bg-red-700 text-white"
                  : "bg-orange-500 hover:bg-orange-400 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
          >
            {saveStatus === "idle" ? "Sauvegarder" : SAVE_STATUS_LABEL[saveStatus]}
          </button>
        </div>

        <MakerPalette onAdd={addElement} />

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

      <EditorCanvas elements={elements} onScreenshotReady={handleScreenshotReady} />

      <Inspector
        element={selectedElement}
        onUpdatePosition={updatePosition}
        onUpdateRotation={updateRotation}
        onUpdateScale={updateScale}
        onUpdateProperties={(properties) => selectedElement && updateElementProperties(selectedElement.id, properties)}
        onRemove={() => selectedElement && removeElement(selectedElement.id)}
      />
    </div>
  );
}

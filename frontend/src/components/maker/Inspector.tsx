import { getMakerElementConfig } from "@/config/makerElementConfig";
import { radToDeg } from "@/lib/maker-math";
import type { MakerElement } from "@/store/useMakerStore";

interface InspectorProps {
  element: MakerElement | null;
  onUpdatePosition: (axis: number, val: number) => void;
  onUpdateRotation: (axis: number, valDeg: number) => void;
  onUpdateScale: (axis: number, val: number) => void;
  onUpdateProperties: (properties: Partial<MakerElement>) => void;
  onRemove: () => void;
}

export function Inspector({
  element,
  onUpdatePosition,
  onUpdateRotation,
  onUpdateScale,
  onUpdateProperties,
  onRemove,
}: InspectorProps) {
  return (
    <div className="w-80 border-l border-gray-800 bg-gray-900/40 p-6 flex flex-col select-none">
      <h2 className="text-xl font-bold text-white mb-6">Inspecteur</h2>

      {element ? (
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
          {/* Infos de base */}
          <div className="border-b border-gray-800 pb-4">
            <div className="text-xs uppercase text-gray-400 tracking-wider font-semibold">
              Type: {getMakerElementConfig(element.type)?.label ?? element.type}
            </div>
            <h3 className="text-lg font-bold text-orange-400 mt-1">{element.name}</h3>
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
                    value={Number(element.position[i].toFixed(2))}
                    onChange={(e) => onUpdatePosition(i, parseFloat(e.target.value) || 0)}
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
                    value={radToDeg(element.rotation[i])}
                    onChange={(e) => onUpdateRotation(i, parseInt(e.target.value) || 0)}
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
                    value={Number(element.scale[i].toFixed(2))}
                    onChange={(e) => onUpdateScale(i, parseFloat(e.target.value) || 1)}
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
                value={element.color || "#ffffff"}
                onChange={(e) => onUpdateProperties({ color: e.target.value })}
                className="w-10 h-10 bg-transparent border-0 rounded cursor-pointer"
              />
              <input
                type="text"
                value={element.color || "#ffffff"}
                onChange={(e) => onUpdateProperties({ color: e.target.value })}
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
                <span>{Math.round((1 - (element.roughness ?? 0.5)) * 100)}% brillant</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={element.roughness ?? 0.5}
                onChange={(e) => onUpdateProperties({ roughness: parseFloat(e.target.value) })}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Matériau (Plastique / Métal)</span>
                <span>{Math.round((element.metalness ?? 0.5) * 100)}% métal</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={element.metalness ?? 0.5}
                onChange={(e) => onUpdateProperties({ metalness: parseFloat(e.target.value) })}
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
                checked={!!element.isBumper}
                onChange={(e) => onUpdateProperties({ isBumper: e.target.checked })}
                className="w-4 h-4 bg-gray-900 border border-gray-800 rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
              />
              <span className="text-sm text-gray-300">Activer l'effet rebond</span>
            </label>

            {element.isBumper && (
              <div className="mt-2 pl-4 border-l border-blue-500/50">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Force de propulsion</span>
                  <span>{element.bumpStrength ?? 15}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="0.5"
                  value={element.bumpStrength ?? 15}
                  onChange={(e) => onUpdateProperties({ bumpStrength: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-auto pt-6 border-t border-gray-800">
            <button
              onClick={onRemove}
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
  );
}

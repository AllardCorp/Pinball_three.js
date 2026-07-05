import { MAKER_ELEMENT_CONFIG, MAKER_ELEMENT_TYPES, type MakerElementType } from "@/config/makerElementConfig";

interface MakerPaletteProps {
  onAdd: (type: MakerElementType) => void;
}

export function MakerPalette({ onAdd }: MakerPaletteProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">Palette</h2>
      <p className="text-xs text-gray-400 mb-6">Ajouter des éléments en 0, 0</p>

      <div className="flex flex-col gap-3">
        {MAKER_ELEMENT_TYPES.map((type) => {
          const config = MAKER_ELEMENT_CONFIG[type];
          return (
            <button
              key={type}
              onClick={() => onAdd(type)}
              className={`${config.paletteColorClass} text-white font-medium py-3 px-4 rounded-xl flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer`}
            >
              <span>{config.emoji} {config.label}</span>
              <span className="text-xs opacity-60">Ajouter</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

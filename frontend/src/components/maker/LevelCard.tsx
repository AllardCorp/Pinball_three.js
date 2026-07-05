import { apiEndpoint } from "@/lib/api";
import type { LevelListItem } from "@/store/useMakerStore";

interface LevelCardProps {
  level: LevelListItem;
  onPlay: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function LevelCard({ level, onPlay, onEdit, onDelete }: LevelCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-orange-500 transition-colors w-full max-w-[280px] mx-auto sm:mx-0">
      {/* Miniature screenshot */}
      <div className="w-full aspect-[2/3] bg-gray-950 flex items-center justify-center overflow-hidden">
        {level.screenshotUrl ? (
          <img
            // `updatedAt` en cache-buster : le fichier est réécrit au même
            // chemin à chaque sauvegarde (PUT), donc l'URL doit changer pour
            // que le navigateur ne serve pas l'ancienne image en cache.
            src={`${apiEndpoint(level.screenshotUrl)}?v=${encodeURIComponent(level.updatedAt)}`}
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
        <div className="flex flex-col gap-2 mt-3">
          <button
            onClick={() => onPlay(level.id)}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer"
          >
            Jouer
          </button>

          {level.isOwner && (
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(level.id)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer"
              >
                Modifier
              </button>
              <button
                onClick={() => onDelete(level.id)}
                className="flex-1 bg-red-950/60 hover:bg-red-900/80 border border-red-900/60 text-red-400 text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

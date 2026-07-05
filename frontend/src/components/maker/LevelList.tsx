import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiEndpoint } from "@/lib/api";
import type { LevelListItem } from "@/store/useMakerStore";
import { LevelCard } from "./LevelCard";

interface LevelListProps {
  onCreate: () => void;
}

export function LevelList({ onCreate }: LevelListProps) {
  const navigate = useNavigate();
  const [levels, setLevels] = useState<LevelListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function fetchLevels() {
    setLoading(true);
    return fetch(apiEndpoint("/api/levels"), { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setLevels(Array.isArray(data) ? data : []))
      .catch(() => setLevels([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchLevels();
  }, []);

  const handlePlay = (id: string) => {
    navigate(`/playfield/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer ce niveau ? Cette action est irréversible.")) {
      return;
    }

    setDeleteError(null);

    const response = await fetch(apiEndpoint(`/api/levels/${id}`), {
      method: "DELETE",
      credentials: "include",
    });

    if (response.status === 204) {
      setLevels((current) => current.filter((level) => level.id !== id));
      return;
    }

    setDeleteError("Impossible de supprimer ce niveau.");
    await fetchLevels();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-500">
        Chargement…
      </div>
    );
  }

  if (levels.length === 0) {
    return (
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
          onClick={onCreate}
          className="bg-orange-500 hover:bg-orange-400 transition-colors text-white font-semibold px-8 py-3 rounded-lg"
        >
          Créer mon premier niveau
        </button>
      </div>
    );
  }

  // Deux groupes séparés (et non un mélange dans la même grille) : chaque
  // carte d'un même groupe a la même forme (boutons identiques), ce qui évite
  // le décalage visuel qu'on aurait si "Modifier"/"Supprimer" apparaissaient
  // seulement sur certaines cartes au milieu d'une grille commune.
  const myLevels = levels.filter((level) => level.isOwner);
  const otherLevels = levels.filter((level) => !level.isOwner);

  return (
    <div className="flex flex-col gap-12">
      {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}

      <section>
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Mes niveaux</h2>
        {myLevels.length === 0 ? (
          <div className="flex items-center justify-between gap-4 bg-gray-900/60 border border-gray-800 rounded-xl px-6 py-4">
            <p className="text-gray-500 text-sm">Tu n'as pas encore créé de niveau.</p>
            <button
              onClick={onCreate}
              className="shrink-0 bg-orange-500 hover:bg-orange-400 transition-colors text-white font-semibold px-4 py-2 rounded-lg text-sm"
            >
              Créer un niveau
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
            {myLevels.map((level) => (
              <LevelCard
                key={level.id}
                level={level}
                onPlay={handlePlay}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {otherLevels.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Tous les niveaux</h2>
          <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
            {otherLevels.map((level) => (
              <LevelCard
                key={level.id}
                level={level}
                onPlay={handlePlay}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

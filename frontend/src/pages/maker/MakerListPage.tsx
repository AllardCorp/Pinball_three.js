import { useNavigate } from "react-router-dom";
import { LevelList } from "@/components/maker/LevelList";

export default function MakerListPage() {
  const navigate = useNavigate();
  const handleCreate = () => navigate("new");

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
        <LevelList onCreate={handleCreate} />
      </main>
    </div>
  );
}

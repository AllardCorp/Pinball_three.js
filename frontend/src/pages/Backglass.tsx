import { useGameStore } from "@/store/useGameStore"; // Adapte le chemin
export default function Backglass() {
  const score = useGameStore((state) => state.score);
  const ballsRemaining = useGameStore((state) => state.ballsRemaining);
  const scoreMultiplier = useGameStore((state) => state.scoreMultiplier);
  const mineHits = useGameStore((state) => state.mineHits);

  const rubiesActive = useGameStore((state) => state.rubiesActive);
  console.log(rubiesActive);
  return (
    <div className="p-6 text-xl">
      <h1>Page BackGlass</h1>

      <h2>Information de la partie</h2>

      <p>Score: {score}</p>
      <p>Balles restantes: {ballsRemaining}</p>
      <p>Multiplicateur: x{scoreMultiplier}</p>
      <p>Mine Hits: {mineHits}</p>
      <div>
        <p>Rubis Actif:</p>
        <ul className="flex gap-4">
          {rubiesActive.map((rubi, i) => (
            <li
              key={i}
              className={
                rubi
                  ? "w-6 h-6 rounded-full bg-emerald-600"
                  : "w-6 h-6 rounded-full bg-gray-400"
              }
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

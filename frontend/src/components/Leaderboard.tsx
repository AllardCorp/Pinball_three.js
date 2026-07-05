import type { LeaderboardEntry } from "../hooks/useLeaderboard";

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  error: boolean;
};

export default function Leaderboard({ entries, isLoading, error }: LeaderboardProps) {
  return (
    <div className="mb-8 w-full max-w-md rounded-xl border border-yellow-500/40 bg-black/60 backdrop-blur">
      <div className="border-b border-yellow-500/30 px-6 py-3 text-center">
        <h3 className="text-lg font-bold uppercase tracking-widest text-yellow-400">
          Meilleurs Scores
        </h3>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-gray-400">Chargement...</p>
      ) : error || entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Aucun score enregistré
        </p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-gray-500">
              <th className="py-2 pl-6 text-left">Rang</th>
              <th className="py-2 text-right">Score</th>
              <th className="py-2 pr-6 text-right">Nom</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.rank}
                className={`border-t border-white/5 ${entry.rank === 1 ? "text-yellow-300" : "text-gray-200"
                  }`}
              >
                <td className="py-2 pl-6 font-mono text-sm font-bold">
                  #{entry.rank}
                </td>
                <td className="py-2 text-right font-mono font-bold">
                  {entry.score.toLocaleString()}
                </td>
                <td className="py-2 pr-6 text-right text-sm text-gray-300">
                  {entry.name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

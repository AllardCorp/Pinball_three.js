import { useEffect, useState } from "react";

import { apiEndpoint } from "../lib/api";

export type LeaderboardEntry = {
  rank: number;
  score: number;
  name: string;
};

type LeaderboardState = {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  error: boolean;
};

export function useLeaderboard() {
  const [state, setState] = useState<LeaderboardState>({
    entries: [],
    isLoading: true,
    error: false,
  });

  useEffect(() => {
    fetch(apiEndpoint("/api/leaderboard"))
      .then((res) => {
        if (!res.ok) throw new Error("leaderboard fetch failed");
        return res.json() as Promise<{ entries: LeaderboardEntry[] }>;
      })
      .then((data) => {
        setState({ entries: data.entries, isLoading: false, error: false });
      })
      .catch(() => {
        setState({ entries: [], isLoading: false, error: true });
      });
  }, []);

  return state;
}

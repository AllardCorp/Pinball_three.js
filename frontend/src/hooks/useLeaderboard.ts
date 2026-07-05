import { useEffect, useState } from "react";

import { apiEndpoint } from "../lib/api";

export type LeaderboardEntry = {
  rank: number;
  score: number;
  name: string;
  username: string;
};

type LeaderboardState = {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  error: boolean;
};

const POLLING_INTERVAL_MS = 15_000;

export function useLeaderboard() {
  const [state, setState] = useState<LeaderboardState>({
    entries: [],
    isLoading: true,
    error: false,
  });

  useEffect(() => {
    function fetchLeaderboard() {
      fetch(apiEndpoint("/api/leaderboard"))
        .then((res) => {
          if (!res.ok) throw new Error("leaderboard fetch failed");
          return res.json() as Promise<{ entries: LeaderboardEntry[] }>;
        })
        .then((data) => {
          setState({ entries: data.entries, isLoading: false, error: false });
        })
        .catch(() => {
          setState((prev) => ({ ...prev, isLoading: false, error: true }));
        });
    }

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return state;
}

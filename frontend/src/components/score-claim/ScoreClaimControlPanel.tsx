import { useForm } from "react-hook-form";

import { getScoreClaimDescription, getScoreClaimPhaseLabel } from "../../lib/score-claim-copy";
import type { ScoreClaimSessionSnapshot } from "../../lib/score-claim-session-store";
import ScoreClaimQrCode from "./ScoreClaimQrCode";

type ScoreClaimControlFormValues = {
  finalScore: number;
  playedDurationSeconds: number;
  requestClaim: boolean;
};

type ScoreClaimControlPanelProps = {
  authenticatedUser:
    | {
        email?: string | null;
        username?: string | null;
      }
    | null;
  isSessionPending: boolean;
  onReset: () => void;
  onStart: (values: ScoreClaimControlFormValues) => Promise<void>;
  snapshot: ScoreClaimSessionSnapshot;
};

export default function ScoreClaimControlPanel({
  authenticatedUser,
  isSessionPending,
  onReset,
  onStart,
  snapshot,
}: ScoreClaimControlPanelProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ScoreClaimControlFormValues>({
    defaultValues: {
      finalScore: 123456,
      playedDurationSeconds: 95,
      requestClaim: true,
    },
  });

  return (
    <div className="absolute right-4 top-10 z-10 w-full max-w-sm rounded-xl bg-white/95 px-4 py-4 text-sm shadow-lg backdrop-blur">
      {/* Ce panneau remplace provisoirement la future UI de fin de partie.
          Il sert à valider le flux score -> sauvegarde -> claim sur la borne. */}
      <div className="space-y-1">
        <p className="font-medium">Console technique score claim</p>
        {isSessionPending && <p className="text-slate-500">Vérification de la session...</p>}
        {!isSessionPending && authenticatedUser && (
          <p className="text-slate-500">
            Connecté : {authenticatedUser.email ?? authenticatedUser.username ?? "compte actif"}
          </p>
        )}
        {!isSessionPending && !authenticatedUser && (
          <p className="text-slate-500">Aucune session web active sur cette borne.</p>
        )}
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit(onStart)}>
        <label className="block">
              <span className="mb-1 block text-slate-600">Score final</span>
          <input
            className="w-full rounded border border-slate-300 px-3 py-2"
            type="number"
            {...register("finalScore", {
              min: {
                value: 0,
                message: "Le score doit être positif.",
              },
              required: "Le score final est requis.",
              valueAsNumber: true,
            })}
          />
          {errors.finalScore && (
            <p className="mt-1 text-xs text-red-600">{errors.finalScore.message}</p>
          )}
        </label>

        <label className="block">
          <span className="mb-1 block text-slate-600">Durée de la partie (secondes)</span>
          <input
            className="w-full rounded border border-slate-300 px-3 py-2"
            type="number"
            {...register("playedDurationSeconds", {
              min: {
                value: 0,
                message: "La durée doit être positive.",
              },
              required: "La durée de partie est requise.",
              valueAsNumber: true,
            })}
          />
          {errors.playedDurationSeconds && (
            <p className="mt-1 text-xs text-red-600">
              {errors.playedDurationSeconds.message}
            </p>
          )}
        </label>

        <label className="flex items-center gap-2 text-slate-600">
          <input type="checkbox" {...register("requestClaim")} />
          Proposer un rattachement mobile en fin de partie
        </label>

        <div className="flex gap-2">
          <button
            className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Création..." : "Simuler la fin de partie"}
          </button>
          <button
            className="rounded border border-slate-300 px-4 py-2 text-slate-700"
            onClick={onReset}
            type="button"
          >
            Réinitialiser
          </button>
        </div>
      </form>

      <div className="mt-5 space-y-3 rounded-lg bg-slate-50 px-4 py-3">
        <p className="font-medium">{getScoreClaimPhaseLabel(snapshot.phase)}</p>
        <p className="text-slate-500">{getScoreClaimDescription(snapshot)}</p>

        {snapshot.game && (
          <div className="space-y-1 text-slate-600">
            <p>Score : {snapshot.game.finalScore}</p>
            <p>Durée : {snapshot.game.playedDurationSeconds} s</p>
            <p>Raison métier : {snapshot.reason ?? "non renseignée"}</p>
          </div>
        )}

        {snapshot.claim?.verificationUrl && (
          <div className="space-y-2">
            <ScoreClaimQrCode verificationUrl={snapshot.claim.verificationUrl} />
            <p className="break-all text-xs text-slate-500">
              {snapshot.claim.verificationUrl}
            </p>
          </div>
        )}

        {snapshot.user?.username && (
          <p className="text-slate-600">Score rattaché à : {snapshot.user.username}</p>
        )}

        {snapshot.errorMessage && (
          <p className="text-red-600">{snapshot.errorMessage}</p>
        )}
      </div>
    </div>
  );
}

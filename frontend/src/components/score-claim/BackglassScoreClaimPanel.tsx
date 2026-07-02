import { getScoreClaimDescription, getScoreClaimPhaseLabel } from "../../lib/score-claim-copy";
import type {
  ScoreClaimSessionPhase,
  ScoreClaimSessionSnapshot,
} from "../../lib/score-claim-session-store";
import ScoreClaimQrCode from "./ScoreClaimQrCode";

type BackglassScoreClaimPanelProps = {
  className?: string;
  snapshot: ScoreClaimSessionSnapshot;
};

const visibleBackglassPhases: ScoreClaimSessionPhase[] = [
  "submitting",
  "claim_pending",
  "claim_approved",
  "claim_expired",
  "error",
];

function formatScore(score: number) {
  return new Intl.NumberFormat("fr-FR").format(score);
}

export function shouldShowBackglassScoreClaimPanel(
  snapshot: ScoreClaimSessionSnapshot,
) {
  return visibleBackglassPhases.includes(snapshot.phase);
}

export default function BackglassScoreClaimPanel({
  className = "",
  snapshot,
}: BackglassScoreClaimPanelProps) {
  if (!shouldShowBackglassScoreClaimPanel(snapshot)) {
    return null;
  }

  const verificationUrl =
    snapshot.phase === "claim_pending"
      ? snapshot.claim?.verificationUrl
      : null;

  return (
    <aside
      className={`rounded-2xl border border-amber-400/30 bg-black/80 p-4 text-sm text-white shadow-lg backdrop-blur ${className}`}
    >
      {/* Ce composant est volontairement autonome : le futur Backglass pourra
          le placer où il veut sans reprendre la logique score-claim. */}
      <p className="text-xs uppercase tracking-[0.25em] text-amber-300">
        Score final
      </p>

      <h2 className="mt-2 text-xl font-bold text-white">
        {getScoreClaimPhaseLabel(snapshot.phase)}
      </h2>

      <p className="mt-2 text-slate-300">
        {getScoreClaimDescription(snapshot)}
      </p>

      {snapshot.game && (
        <p className="mt-4 rounded-lg bg-white/10 px-3 py-2 font-semibold text-amber-100">
          Score : {formatScore(snapshot.game.finalScore)}
        </p>
      )}

      {verificationUrl && (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-amber-400/20 bg-stone-950/90 p-4">
          <div className="rounded-xl bg-amber-50 p-2 shadow-[0_0_22px_rgba(251,191,36,0.28)]">
            <ScoreClaimQrCode verificationUrl={verificationUrl} />
          </div>
          <p className="mt-3 text-center text-xs text-slate-300">
            Scannez, connectez-vous, puis confirmez le score.
          </p>
        </div>
      )}

      {snapshot.phase === "claim_approved" && (
        <p className="mt-4 rounded-lg border border-emerald-300/30 bg-emerald-950/60 px-3 py-2 text-emerald-100">
          {snapshot.user?.username
            ? `Rattaché à ${snapshot.user.username}`
            : "Score rattaché au compte joueur."}
        </p>
      )}

      {snapshot.phase === "claim_expired" && (
        <p className="mt-4 rounded-lg border border-orange-300/30 bg-orange-950/60 px-3 py-2 text-orange-100">
          Relancez une partie pour générer un nouveau QR code.
        </p>
      )}

      {snapshot.errorMessage && (
        <p className="mt-4 rounded-lg border border-red-300/30 bg-red-950/60 px-3 py-2 text-red-100">
          {snapshot.errorMessage}
        </p>
      )}
    </aside>
  );
}

import { useMemo } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";

import { useAppMode } from "../hooks/useAppMode";
import { useScoreClaim } from "../hooks/useScoreClaim";
import { useSession } from "../lib/auth-client";

function formatPlayedAt(playedAt: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(playedAt));
}

export default function ScoreClaim() {
  const [searchParams] = useSearchParams();
  const claimCode = searchParams.get("code") ?? "";
  const { withMode } = useAppMode();
  const redirectTo = useMemo(
    () => withMode(`/score-claim?code=${encodeURIComponent(claimCode)}`),
    [claimCode, withMode],
  );
  const { data: session, isPending } = useSession();
  const { approveScoreClaim, claim, feedback, isApproving, status } = useScoreClaim({
    claimCode,
  });

  if (!claimCode) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Aucun score à rattacher</h1>
          <p className="mt-3 text-sm text-slate-500">
            Cette page fonctionne uniquement après le scan d'un QR code généré
            par le flipper en fin de partie.
          </p>
          <Link className="mt-6 inline-block text-blue-600" to={withMode("/")}>
            Retour à l'accueil
          </Link>
        </section>
      </main>
    );
  }

  if (!isPending && !session && status === "pending") {
    return <Navigate replace to={withMode(`/login?redirect=${encodeURIComponent(redirectTo)}`)} />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-12">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Cette page confirme le rattachement d'un score déjà sauvegardé.
            Elle ne crée pas le score : elle ne fait que l'associer à un compte. */}
        <h1 className="text-2xl font-semibold">Rattacher un score</h1>

        {status === "loading" && (
          <p className="mt-4 text-sm text-slate-500">Chargement de la demande...</p>
        )}

        {status === "not_found" && (
          <p className="mt-4 text-sm text-slate-500">
            Cette demande de rattachement est introuvable.
          </p>
        )}

        {status === "expired" && (
          <p className="mt-4 text-sm text-slate-500">
            Le délai pour rattacher ce score est expiré.
          </p>
        )}

        {status === "error" && (
          <p className="mt-4 text-sm text-slate-500">
            Impossible de charger cette demande pour le moment.
          </p>
        )}

        {claim && (
          <div className="mt-6 space-y-5">
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <p className="font-medium">Score final : {claim.game.finalScore}</p>
              <p className="text-slate-500">
                Partie jouée le {formatPlayedAt(claim.game.playedAt)}
              </p>
              <p className="text-slate-500">
                Durée : {claim.game.playedDurationSeconds} secondes
              </p>
              {claim.user?.username && (
                <p className="text-slate-500">
                  Déjà rattaché à : {claim.user.username}
                </p>
              )}
            </div>

            {isPending && (
              <p className="text-sm text-slate-500">Vérification de la session...</p>
            )}

            {session && status === "pending" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
                  <p className="font-medium">{session.user.email}</p>
                  <p className="text-slate-500">
                    Username: {session.user.username ?? "non défini"}
                  </p>
                </div>

                <button
                  className="w-full rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
                  disabled={isApproving}
                  onClick={approveScoreClaim}
                  type="button"
                >
                  {isApproving ? "Association..." : "Associer ce score à mon compte"}
                </button>
              </div>
            )}

            {status === "approved" && (
              <p className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700">
                Ce score est déjà rattaché à un compte.
              </p>
            )}
          </div>
        )}

        {feedback && (
          <p className="mt-6 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {feedback}
          </p>
        )}
      </section>
    </main>
  );
}

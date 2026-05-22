import ScoreClaimQrCode from "../components/score-claim/ScoreClaimQrCode";
import { useAppMode } from "../hooks/useAppMode";
import { useScoreClaimSession } from "../hooks/useScoreClaimSession";
import { getScoreClaimPhaseLabel } from "../lib/score-claim-copy";

export default function Backglass() {
  const { mode } = useAppMode();
  const { snapshot } = useScoreClaimSession({ enabled: false, mode });

  return (
    <main className="flex min-h-screen items-center justify-center bg-white/50 px-6 py-10 text-white">
      {/* Le Backglass reste volontairement très simple pendant la phase de validation.
          On veut juste vérifier l'état métier et la présence du QR. */}
      <section className="flex w-full max-w-2xl flex-col items-center rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
          Backglass technique
        </p>
        <h1 className="mt-4 text-4xl font-semibold">
          {getScoreClaimPhaseLabel(snapshot.phase)}
        </h1>

        {snapshot.game && (
          <p className="mt-4 text-lg text-slate-700">
            Score : {snapshot.game.finalScore}
          </p>
        )}

        <div className="mt-8 flex flex-col items-center">
          {snapshot.claim?.verificationUrl ? (
            <>
              <ScoreClaimQrCode verificationUrl={snapshot.claim.verificationUrl} />
              <p className="mt-5 text-center text-sm text-slate-700">
                Scannez pour rattacher le score à votre compte.
              </p>
            </>
          ) : (
            <p className="max-w-sm text-center text-slate-400">
              Aucun QR code tant qu'un score n'entre pas dans l'état
              <span className="mx-1 font-medium text-white">save_and_claimable</span>.
            </p>
          )}

          {snapshot.user?.username && (
            <p className="mt-6 text-sm text-slate-300">
              Score rattaché à {snapshot.user.username}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

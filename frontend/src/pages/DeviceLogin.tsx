import { useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";

import { apiEndpoint } from "../lib/api";
import { useSession } from "../lib/auth-client";

export default function DeviceLogin() {
  const [searchParams] = useSearchParams();
  const deviceCode = searchParams.get("code") ?? "";
  const redirectTo = useMemo(
    () => `/device-login?code=${encodeURIComponent(deviceCode)}`,
    [deviceCode],
  );
  const { data: session, isPending } = useSession();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  if (!deviceCode) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Code QR invalide</h1>
          <p className="mt-3 text-sm text-slate-500">
            La demande de connexion ne contient pas de code appareil.
          </p>
          <Link className="mt-6 inline-block text-blue-600" to="/">
            Retour a l'accueil
          </Link>
        </section>
      </main>
    );
  }

  if (!isPending && !session) {
    return <Navigate replace to={`/login?redirect=${encodeURIComponent(redirectTo)}`} />;
  }

  async function approveDeviceLogin() {
    setFeedback(null);
    setIsApproving(true);

    try {
      const response = await fetch(apiEndpoint("/api/device-login/approve"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceCode }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setFeedback(payload?.error ?? "Connexion du flipper impossible.");
        return;
      }

      setIsApproved(true);
      setFeedback("Connexion au flipper réussie, amusez-vous !");
    } finally {
      setIsApproving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Connexion du flipper</h1>

        {isPending && (
          <p className="mt-4 text-sm text-slate-500">Vérification de la session...</p>
        )}

        {session && (
          <div className="mt-6 space-y-5">
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <p className="font-medium">{session.user.email}</p>
              <p className="text-slate-500">
                Username: {session.user.username ?? "non defini"}
              </p>
            </div>

            <button
              className="w-full rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
              disabled={isApproving || isApproved}
              onClick={approveDeviceLogin}
              type="button"
            >
              {isApproved
                ? "Flipper connecté"
                : isApproving
                  ? "Connexion..."
                  : "Connecter ce flipper"}
            </button>

            {feedback && (
              <p className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700">
                {feedback}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}


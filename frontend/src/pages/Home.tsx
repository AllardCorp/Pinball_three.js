import { Link } from "react-router-dom";

import { useAppMode } from "../hooks/useAppMode";
import { signOut, useSession } from "../lib/auth-client";

export default function Home() {
  const { data: session, isPending } = useSession();
  const { withMode } = useAppMode();

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 px-6">
      <h2 className="text-3xl font-semibold">Pinball Three.js</h2>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link className="hover:text-blue-600" to={withMode("/login")}>
          Login
        </Link>
        <Link className="hover:text-blue-600" to={withMode("/dashboard")}>
          Dashboard
        </Link>
        <Link className="hover:text-blue-600" to={withMode("/playfield")}>
          Playfield
        </Link>
        <Link className="hover:text-blue-600" to={withMode("/backglass")}>
          Backglass
        </Link>
        <Link className="hover:text-blue-600" to={withMode("/dmd")}>
          DMD
        </Link>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
        {isPending && <p>Chargement de la session...</p>}
        {!isPending && !session && <p>Aucune session active.</p>}
        {session && (
          <div className="space-y-1">
            <p>
              Connecté en tant que <strong>{session.user.email}</strong>
            </p>
            <p className="text-slate-500">
              Username: {session.user.username ?? "non defini"}
            </p>
            <button
              className="rounded bg-slate-900 px-3 py-1 text-white"
              onClick={async () => {
                await signOut();
              }}
              type="button"
            >
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";

import { useAppMode } from "../hooks/useAppMode";
import { isPublicAppTarget } from "../lib/app-target";
import { signOut, useSession } from "../lib/auth-client";

type HomeLink = {
  label: string;
  path: string;
};

export function getHomeLinks(isPublicTarget = isPublicAppTarget): HomeLink[] {
  const publicLinks: HomeLink[] = [
    { label: "Login", path: "/login" },
    { label: "Dashboard", path: "/dashboard" },
  ];

  if (isPublicTarget) {
    return publicLinks;
  }

  // Ces écrans appartiennent au build flipper local. On ne les expose pas
  // sur le portail VPS pour éviter des liens cassés ou inutiles côté mobile.
  return [
    ...publicLinks,
    { label: "Playfield", path: "/playfield" },
    { label: "Backglass", path: "/backglass" },
    { label: "DMD", path: "/dmd" },
  ];
}

export default function Home() {
  const { data: session, isPending } = useSession();
  const { withMode } = useAppMode();
  const homeLinks = getHomeLinks();

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 px-6">
      <h2 className="text-3xl font-semibold">Pinball Three.js</h2>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {homeLinks.map((link) => (
          <Link
            className="hover:text-blue-600"
            key={link.path}
            to={withMode(link.path)}
          >
            {link.label}
          </Link>
        ))}
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

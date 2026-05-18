import { Link, useNavigate } from "react-router-dom";

import { signOut, useSession } from "../lib/auth-client";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-500">
            La session Better Auth est accessible ici et dans le Playfield.
          </p>
        </div>
        <button
          className="rounded bg-slate-900 px-4 py-2 text-white"
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
          type="button"
        >
          Se deconnecter
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">Utilisateur connecte</h2>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-slate-500">ID</dt>
            <dd>{session.user.id}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Nom</dt>
            <dd>{session.user.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd>{session.user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Username</dt>
            <dd>{session.user.username ?? "non defini"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">Liens utiles</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link className="text-blue-600" to="/">
            Retour a l'accueil
          </Link>
          <Link className="text-blue-600" to="/playfield">
            Ouvrir le Playfield
          </Link>
        </div>
      </section>
    </main>
  );
}

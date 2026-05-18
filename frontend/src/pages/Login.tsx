import type {FormEvent} from "react";
import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { signIn, signUp, useSession } from "../lib/auth-client";

type AuthMode = "login" | "signup";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const { data: session, isPending } = useSession();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isPending && session) {
    return <Navigate replace to={redirectTo} />;
  }

  async function handleCredentialsSubmit(event : FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        const result = await signUp.email({
          email,
          password,
          name,
          username,
        });

        if (result.error) {
          setFeedback(result.error.message ?? "Impossible de creer le compte.");
          return;
        }

        setFeedback("Compte cree. La session a ete ouverte automatiquement.");
        navigate(redirectTo);
        return;
      }

      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setFeedback(result.error.message ?? "Connexion impossible.");
        return;
      }

      setFeedback("Connexion reussie.");
      navigate(redirectTo);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSocialLogin(provider: "github" | "google") {
    setFeedback(null);

    const result = await signIn.social({
      provider,
      callbackURL: `${window.location.origin}${redirectTo}`,
    });

    if (result.error) {
      setFeedback(result.error.message ?? `Connexion ${provider} impossible.`);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 space-y-3">
          <h1 className="text-3xl font-semibold">Authentification</h1>
          <p className="text-sm text-slate-500">
            Credentials et OAuth partagent la meme session Better Auth.
          </p>
        </div>

        <div className="mb-6 flex gap-3">
          <button
            className={`rounded px-4 py-2 text-sm ${mode === "login" ? "bg-slate-900 text-white" : "bg-slate-100"}`}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={`rounded px-4 py-2 text-sm ${mode === "signup" ? "bg-slate-900 text-white" : "bg-slate-100"}`}
            onClick={() => setMode("signup")}
            type="button"
          >
            Creer un compte
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleCredentialsSubmit}>
          {mode === "signup" && (
            <>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Nom affiché</span>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  onChange={(event) => setName(event.target.value)}
                  required
                  value={name}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Username</span>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  value={username}
                />
              </label>
            </>
          )}

          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Email</span>
            <input
              className="w-full rounded border border-slate-300 px-3 py-2"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Mot de passe</span>
            <input
              className="w-full rounded border border-slate-300 px-3 py-2"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          <button
            className="w-full rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Envoi..."
              : mode === "signup"
                ? "Creer mon compte"
                : "Se connecter"}
          </button>
        </form>

        <div className="my-6 h-px bg-slate-200" />

        <div className="space-y-3">
          <button
            className="w-full rounded border border-slate-300 px-4 py-2"
            onClick={() => handleSocialLogin("github")}
            type="button"
          >
            Continuer avec GitHub
          </button>
          <button
            className="w-full rounded border border-slate-300 px-4 py-2"
            onClick={() => handleSocialLogin("google")}
            type="button"
          >
            Continuer avec Google
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Configure les credentials GitHub et Google dans le fichier d'environnement
          pour activer les providers OAuth.
        </p>

        {feedback && (
          <p className="mt-6 rounded bg-slate-100 px-3 py-2 text-sm text-slate-700">
            {feedback}
          </p>
        )}
      </div>
    </main>
  );
}

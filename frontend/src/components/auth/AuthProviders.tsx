import type { AuthProvider } from "./auth.shared";

type AuthProvidersProps = {
  disabled: boolean;
  loadingProvider: AuthProvider | null;
  onSocialLogin: (provider: AuthProvider) => void;
};

export default function AuthProviders({
  disabled,
  loadingProvider,
  onSocialLogin,
}: AuthProvidersProps) {
  return (
    <div className="space-y-3">
      {/* Ce bloc regroupe uniquement les fournisseurs externes.
          La logique de login OAuth reste pilotée par la page parente. */}
      <button
        className="w-full rounded border border-slate-300 px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-slate-50"
        disabled={disabled}
        onClick={() => onSocialLogin("github")}
        type="button"
      >
        {loadingProvider === "github" ? "Connexion à GitHub..." : "Continuer avec GitHub"}
      </button>
      <button
        className="w-full rounded border border-slate-300 px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-slate-50"
        disabled={disabled}
        onClick={() => onSocialLogin("google")}
        type="button"
      >
        {loadingProvider === "google" ? "Connexion à Google..." : "Continuer avec Google"}
      </button>
    </div>
  );
}

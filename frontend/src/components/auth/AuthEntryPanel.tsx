import type { ComponentPropsWithoutRef } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import AuthProviders from "./AuthProviders";
import CredentialsForm from "./CredentialsForm";
import type { AuthMode, AuthProvider, FormValues } from "./auth.shared";

type AuthEntryPanelProps = {
  errors: FieldErrors<FormValues>;
  feedback: string | null;
  isFormSubmitting: boolean;
  isFormValid: boolean;
  isProvidersDisabled: boolean;
  loadingProvider: AuthProvider | null;
  mode: AuthMode;
  onCredentialsSubmit: ComponentPropsWithoutRef<"form">["onSubmit"];
  onSocialLogin: (provider: AuthProvider) => void;
  onSwitchMode: (mode: AuthMode) => void;
  passwordValue: string;
  register: UseFormRegister<FormValues>;
  showPassword: boolean;
  onTogglePassword: () => void;
};

export default function AuthEntryPanel({
  errors,
  feedback,
  isFormSubmitting,
  isFormValid,
  isProvidersDisabled,
  loadingProvider,
  mode,
  onCredentialsSubmit,
  onSocialLogin,
  onSwitchMode,
  passwordValue,
  register,
  showPassword,
  onTogglePassword,
}: AuthEntryPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      {/* Ce panneau assemble les briques d'entrée d'auth.
          La page garde l'orchestration métier, mais l'UI devient réutilisable. */}
      <div className="mb-8 space-y-3">
        <h1 className="text-3xl font-semibold">Authentification</h1>
        <p className="text-sm text-slate-500">
          Connecte-toi avec ton adresse email, ton mot de passe ou un compte tiers.
        </p>
      </div>

      <div className="mb-6 flex gap-3">
        <button
          className={`rounded px-4 py-2 text-sm transition ${mode === "login" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          onClick={() => onSwitchMode("login")}
          type="button"
        >
          Se connecter
        </button>
        <button
          className={`rounded px-4 py-2 text-sm transition ${mode === "signup" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          onClick={() => onSwitchMode("signup")}
          type="button"
        >
          Créer un compte
        </button>
      </div>

      <CredentialsForm
        disabled={isProvidersDisabled}
        errors={errors}
        isSubmitting={isFormSubmitting}
        isValid={isFormValid}
        mode={mode}
        onSubmit={onCredentialsSubmit}
        passwordValue={passwordValue}
        register={register}
        showPassword={showPassword}
        onTogglePassword={onTogglePassword}
      />

      <div className="my-6 h-px bg-slate-200" />

      <AuthProviders
        disabled={isProvidersDisabled || isFormSubmitting}
        loadingProvider={loadingProvider}
        onSocialLogin={onSocialLogin}
      />

      {feedback && (
        <p
          className="mt-6 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
          role="alert"
        >
          {feedback}
        </p>
      )}
    </div>
  );
}

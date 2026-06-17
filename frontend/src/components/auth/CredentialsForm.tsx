import type { ComponentPropsWithoutRef } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import {
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  getPasswordHint,
  type AuthMode,
  type FormValues,
  validateEmail,
  validateName,
  validatePassword,
  validateUsername,
} from "./auth.shared";

type CredentialsFormProps = {
  disabled: boolean;
  errors: FieldErrors<FormValues>;
  isSubmitting: boolean;
  isValid: boolean;
  mode: AuthMode;
  onSubmit: ComponentPropsWithoutRef<"form">["onSubmit"];
  passwordValue: string;
  register: UseFormRegister<FormValues>;
  showPassword: boolean;
  onTogglePassword: () => void;
};

function getInputClass(hasError: boolean) {
  return `w-full rounded border px-3 py-2 outline-none transition focus:ring-2 ${
    hasError
      ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100"
      : "border-slate-300 focus:border-slate-500 focus:ring-slate-200"
  }`;
}

export default function CredentialsForm({
  disabled,
  errors,
  isSubmitting,
  isValid,
  mode,
  onSubmit,
  passwordValue,
  register,
  showPassword,
  onTogglePassword,
}: CredentialsFormProps) {
  return (
    <form className="space-y-4" noValidate onSubmit={onSubmit}>
      {/* Ce composant n'effectue aucun appel réseau.
          Il affiche le formulaire et laisse la page gérer la soumission. */}
      {mode === "signup" && (
        <>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Nom affiché</span>
            <input
              autoComplete="name"
              aria-describedby={errors.name ? "name-error" : undefined}
              aria-invalid={Boolean(errors.name)}
              className={getInputClass(Boolean(errors.name))}
              {...register("name", {
                validate: (value) => (mode !== "signup" ? true : (validateName(value) ?? true)),
              })}
              required
            />
            {errors.name?.message && (
              <p className="mt-1 text-xs text-red-600" id="name-error" role="alert">
                {errors.name.message}
              </p>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Nom d'utilisateur</span>
            <input
              aria-describedby={errors.username ? "username-error" : "username-hint"}
              aria-invalid={Boolean(errors.username)}
              autoCapitalize="none"
              autoCorrect="off"
              className={getInputClass(Boolean(errors.username))}
              {...register("username", {
                validate: (value) =>
                  mode !== "signup" ? true : (validateUsername(value) ?? true),
              })}
              required
              spellCheck={false}
            />
            {errors.username?.message ? (
              <p className="mt-1 text-xs text-red-600" id="username-error" role="alert">
                {errors.username.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500" id="username-hint">
                Entre 3 et {MAX_USERNAME_LENGTH} caractères, sans espaces.
              </p>
            )}
          </label>
        </>
      )}

      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">Adresse email</span>
        <input
          autoComplete="email"
          aria-describedby={errors.email ? "email-error" : undefined}
          aria-invalid={Boolean(errors.email)}
          className={getInputClass(Boolean(errors.email))}
          {...register("email", {
            validate: (value) => validateEmail(value) ?? true,
          })}
          required
          type="email"
        />
        {errors.email?.message && (
          <p className="mt-1 text-xs text-red-600" id="email-error" role="alert">
            {errors.email.message}
          </p>
        )}
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">Mot de passe</span>
        <div className="relative">
          <input
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            aria-describedby={errors.password ? "password-error" : "password-hint"}
            aria-invalid={Boolean(errors.password)}
            className={`${getInputClass(Boolean(errors.password))} pr-24`}
            minLength={MIN_PASSWORD_LENGTH}
            {...register("password", {
              validate: (value) => validatePassword(value) ?? true,
            })}
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
            onClick={onTogglePassword}
            type="button"
          >
            {showPassword ? "Masquer" : "Afficher"}
          </button>
        </div>
        {errors.password?.message ? (
          <p className="mt-1 text-xs text-red-600" id="password-error" role="alert">
            {errors.password.message}
          </p>
        ) : (
          <p className="mt-1 text-xs text-slate-500" id="password-hint">
            {getPasswordHint(passwordValue)}
          </p>
        )}
      </label>

      <button
        className="w-full rounded bg-slate-900 px-4 py-2 text-white transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-slate-800"
        disabled={disabled || isSubmitting || !isValid}
        type="submit"
      >
        {isSubmitting
          ? "Vérification en cours..."
          : mode === "signup"
            ? "Créer mon compte joueur"
            : "Lancer la session"}
      </button>
    </form>
  );
}

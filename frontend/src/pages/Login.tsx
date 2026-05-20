import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { signIn, signUp, useSession } from "../lib/auth-client";

type AuthMode = "login" | "signup";
type AuthProvider = "github" | "google";
type FieldName = "name" | "username" | "email" | "password";
type FormValues = Record<FieldName, string>;
type FieldErrors = Partial<Record<FieldName, string>>;
type FieldRefs = Record<FieldName, React.RefObject<HTMLInputElement | null>>;

// ─── AMÉLIORATION : MESSAGES OAUTH PLUS CLAIRS ET SANS FAUTES ───
function getAuthErrorFeedback(
  errorCode: string | null,
  provider: string | null,
) {
  if (!errorCode) return null;

  const providerLabel =
    provider === "github" ? "GitHub" : provider === "google" ? "Google" : "ce fournisseur";

  if (errorCode === "account_not_linked") {
    return `Un compte existe déjà avec cette adresse email, mais il n'est pas lié à ${providerLabel}`;
  }

  if (errorCode === "account_already_linked_to_different_user") {
    return `Ce compte ${providerLabel} est déjà associé à un autre joueur.`;
  }

  return "La connexion via le fournisseur tiers a échoué. Réessaie ou choisis une autre méthode.";
}

// ─── AMÉLIORATION : MESSAGES DE VALIDATION ORIENTÉS ACTION ───
function validateName(name: string): string | null {
  if (!name.trim()) {
    return "Veuillez renseigner le nom à afficher.";
  }

  if (name.trim().length < 2) {
    return "Le nom doit contenir au moins 2 caractères.";
  }

  return null;
}

function validateUsername(username: string): string | null {
  const trimmedUsername = username.trim();

  if (!trimmedUsername) {
    return "Un nom d'utilisateur est requis.";
  }

  if (trimmedUsername.length < 3) {
    return "Le nom d'utilisateur doit contenir au moins 3 caractères.";
  }

  if (trimmedUsername.length > 15) {
    return "Le nom d'utilisateur ne peut pas dépasser 15 caractères.";
  }

  if (/\s/.test(trimmedUsername)) {
    return "Le nom d'utilisateur ne doit pas contenir d'espaces.";
  }

  return null;
}

function validateEmail(email: string): string | null {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return "Veuillez renseigner une adresse email.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmedEmail)) {
    return "L'adresse email n'est pas au bon format (ex: joueur@email.com).";
  }

  return null;
}

function validatePassword(password: string): string | null {
  if (!password) {
    return "Le mot de passe est requis.";
  }

  if (password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caractères.";
  }

  return null;
}

function getFieldErrors(mode: AuthMode, values: FormValues): FieldErrors {
  return {
    ...(mode === "signup"
      ? {
          name: validateName(values.name) ?? undefined,
          username: validateUsername(values.username) ?? undefined,
        }
      : {}),
    email: validateEmail(values.email) ?? undefined,
    password: validatePassword(values.password) ?? undefined,
  };
}

// ─── AMÉLIORATION : RETOURS D'ERREURS SERVEUR HARMONISÉS ───
function getCredentialErrorFeedback(
  mode: AuthMode,
  errorCode: string | null | undefined,
  message: string | null | undefined,
): { feedback: string | null; fieldErrors: FieldErrors } {
  const normalizedCode = errorCode?.toLowerCase() ?? "";
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (
    normalizedCode.includes("username") &&
    normalizedCode.includes("taken")
  ) {
    return {
      feedback: null,
      fieldErrors: { username: "Ce nom d'utilisateur est déjà pris." },
    };
  }

  if (
    normalizedCode.includes("email") &&
    (normalizedCode.includes("taken") || normalizedCode.includes("exists"))
  ) {
    return {
      feedback: null,
      fieldErrors: { email: "Cette adresse email est déjà utilisée." },
    };
  }

  if (
    normalizedCode.includes("invalid_email") ||
    normalizedMessage.includes("email")
  ) {
    return {
      feedback: null,
      fieldErrors: { email: "Vérifie le format de ton adresse email." },
    };
  }

  if (
    normalizedCode.includes("password") &&
    normalizedCode.includes("short")
  ) {
    return {
      feedback: null,
      fieldErrors: { password: "Le mot de passe doit contenir au moins 8 caractères." },
    };
  }

  if (
    normalizedCode.includes("invalid_credentials") ||
    normalizedCode.includes("invalid_credential")
  ) {
    return {
      feedback: "Adresse email ou mot de passe incorrect.",
      fieldErrors: {},
    };
  }

  if (normalizedCode.includes("user_not_found")) {
    return {
      feedback: "Aucun compte joueur ne correspond à cette adresse email.",
      fieldErrors: {},
    };
  }

  return {
    feedback:
      message ??
      (mode === "signup"
        ? "Impossible de créer le compte. Réessaie dans quelques instants."
        : "La connexion a échoué. Vérifie tes identifiants."),
    fieldErrors: {},
  };
}

function getInputClass(hasError: boolean) {
  return `w-full rounded border px-3 py-2 outline-none transition focus:ring-2 ${
    hasError
      ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100"
      : "border-slate-300 focus:border-slate-500 focus:ring-slate-200"
  }`;
}

// ─── AMÉLIORATION : INJECTION DE MICRO-COPIE "GAMING/PINBALL" SUR LES ÉTATS NEUTRES ───
function getPasswordHint(password: string) {
  if (!password) {
    return "Minimum 8 caractères.";
  }

  if (password.length < 8) {
    return "Mot de passe trop court.";
  }

  if (password.length < 12) {
    return "Sécurité modérée";
  }

  return "Mot de passe solide comme un flipper en acier !";
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const authError = searchParams.get("error") ?? searchParams.get("code");
  const authProvider = searchParams.get("provider");
  const { data: session, isPending } = useSession();
  const [mode, setMode] = useState<AuthMode>("login");
  const [formValues, setFormValues] = useState<FormValues>({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<string | null>(() =>
    getAuthErrorFeedback(authError, authProvider),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoadingProvider, setSocialLoadingProvider] =
    useState<AuthProvider | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const fieldRefs: FieldRefs = {
    name: useRef<HTMLInputElement>(null),
    username: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
  };

  if (!isPending && session) {
    return <Navigate replace to={redirectTo} />;
  }

  const currentFieldErrors = getFieldErrors(mode, formValues);
  const isCredentialsFormValid = Object.values(currentFieldErrors).every(
    (error) => !error,
  );

  function updateFieldValue(field: FieldName, value: string) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextValues = {
        ...formValues,
        [field]: value,
      };
      const nextErrors = getFieldErrors(mode, nextValues);
      return {
        ...currentErrors,
        [field]: nextErrors[field],
      };
    });
  }

  function focusFirstError(errors: FieldErrors) {
    const fieldOrder: FieldName[] =
      mode === "signup"
        ? ["name", "username", "email", "password"]
        : ["email", "password"];

    for (const field of fieldOrder) {
      if (errors[field]) {
        fieldRefs[field].current?.focus();
        break;
      }
    }
  }

  function handleFieldBlur(field: FieldName) {
    const nextErrors = getFieldErrors(mode, formValues);
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: nextErrors[field],
    }));
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setFieldErrors({});
    setFeedback(null);
    setShowPassword(false);
    setFormValues((currentValues) => ({
      ...currentValues,
      name: "",
      username: "",
      password: "",
    }));
  }

  async function handleCredentialsSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors = getFieldErrors(mode, formValues);
    setFieldErrors(nextErrors);
    setFeedback(null);

    if (Object.values(nextErrors).some(Boolean)) {
      focusFirstError(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        const result = await signUp.email({
          email: formValues.email.trim(),
          password: formValues.password,
          name: formValues.name.trim(),
          username: formValues.username.trim(),
        });

        if (result.error) {
          const nextFeedback = getCredentialErrorFeedback(
            mode,
            result.error.code,
            result.error.message,
          );
          setFieldErrors(nextFeedback.fieldErrors);
          setFeedback(nextFeedback.feedback);
          focusFirstError(nextFeedback.fieldErrors);
          return;
        }

        navigate(redirectTo);
        return;
      }

      const result = await signIn.email({
        email: formValues.email.trim(),
        password: formValues.password,
      });

      if (result.error) {
        const nextFeedback = getCredentialErrorFeedback(
          mode,
          result.error.code,
          result.error.message,
        );
        setFieldErrors(nextFeedback.fieldErrors);
        setFeedback(nextFeedback.feedback);
        focusFirstError(nextFeedback.fieldErrors);
        return;
      }

      navigate(redirectTo);
    } catch {
      setFeedback("Une erreur inattendue est survenue. Réessaie.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSocialLogin(provider: AuthProvider) {
    setFeedback(null);
    setSocialLoadingProvider(provider);

    const errorCallbackURL = new URL("/login", window.location.origin);
    errorCallbackURL.searchParams.set("redirect", redirectTo);
    errorCallbackURL.searchParams.set("provider", provider);

    const result = await signIn.social({
      provider,
      callbackURL: `${window.location.origin}${redirectTo}`,
      errorCallbackURL: errorCallbackURL.toString(),
    });

    if (result.error) {
      setFeedback(
        getAuthErrorFeedback(result.error.code ?? null, provider) ??
          result.error.message ??
          `Connexion via ${provider === "github" ? "GitHub" : "Google"} impossible.`,
      );
      setSocialLoadingProvider(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 space-y-3">
          <h1 className="text-3xl font-semibold">Authentification</h1>
          <p className="text-sm text-slate-500">
            Connecte-toi avec ton adresse email, ton mot de passe ou un compte tiers.
          </p>
        </div>

        <div className="mb-6 flex gap-3">
          <button
            className={`rounded px-4 py-2 text-sm transition ${mode === "login" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            onClick={() => switchMode("login")}
            type="button"
          >
            Se connecter
          </button>
          <button
            className={`rounded px-4 py-2 text-sm transition ${mode === "signup" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            onClick={() => switchMode("signup")}
            type="button"
          >
            Créer un compte
          </button>
        </div>

        <form className="space-y-4" noValidate onSubmit={handleCredentialsSubmit}>
          {mode === "signup" && (
            <>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Nom affiché</span>
                <input
                  autoComplete="name"
                  aria-describedby={fieldErrors.name ? "name-error" : undefined}
                  aria-invalid={Boolean(fieldErrors.name)}
                  className={getInputClass(Boolean(fieldErrors.name))}
                  onBlur={() => handleFieldBlur("name")}
                  onChange={(event) => updateFieldValue("name", event.target.value)}
                  ref={fieldRefs.name}
                  required
                  value={formValues.name}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-600" id="name-error" role="alert">
                    {fieldErrors.name}
                  </p>
                )}
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Nom d'utilisateur</span>
                <input
                  aria-describedby={fieldErrors.username ? "username-error" : "username-hint"}
                  aria-invalid={Boolean(fieldErrors.username)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  className={getInputClass(Boolean(fieldErrors.username))}
                  onBlur={() => handleFieldBlur("username")}
                  onChange={(event) => updateFieldValue("username", event.target.value)}
                  ref={fieldRefs.username}
                  required
                  spellCheck={false}
                  value={formValues.username}
                />
                {fieldErrors.username ? (
                  <p className="mt-1 text-xs text-red-600" id="username-error" role="alert">
                    {fieldErrors.username}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500" id="username-hint">
                    Entre 3 et 15 caractères, sans espaces.
                  </p>
                )}
              </label>
            </>
          )}

          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Adresse email</span>
            <input
              autoComplete="email"
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              aria-invalid={Boolean(fieldErrors.email)}
              className={getInputClass(Boolean(fieldErrors.email))}
              onBlur={() => handleFieldBlur("email")}
              onChange={(event) => updateFieldValue("email", event.target.value)}
              ref={fieldRefs.email}
              required
              type="email"
              value={formValues.email}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600" id="email-error" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Mot de passe</span>
            <div className="relative">
              <input
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
                aria-invalid={Boolean(fieldErrors.password)}
                className={`${getInputClass(Boolean(fieldErrors.password))} pr-24`}
                minLength={8}
                onBlur={() => handleFieldBlur("password")}
                onChange={(event) => updateFieldValue("password", event.target.value)}
                ref={fieldRefs.password}
                required
                type={showPassword ? "text" : "password"}
                value={formValues.password}
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                onClick={() => setShowPassword((currentValue) => !currentValue)}
                type="button"
              >
                {showPassword ? "Masquer" : "Afficher"}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="mt-1 text-xs text-red-600" id="password-error" role="alert">
                {fieldErrors.password}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500" id="password-hint">
                {getPasswordHint(formValues.password)}
              </p>
            )}
          </label>

          <button
            className="w-full rounded bg-slate-900 px-4 py-2 text-white transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-slate-800"
            disabled={isSubmitting || socialLoadingProvider !== null || !isCredentialsFormValid}
            type="submit"
          >
            {isSubmitting
              ? "Vérification en cours..."
              : mode === "signup"
                ? "Créer mon compte joueur"
                : "Lancer la session"}
          </button>
        </form>

        <div className="my-6 h-px bg-slate-200" />

        <div className="space-y-3">
          <button
            className="w-full rounded border border-slate-300 px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-slate-50"
            disabled={isSubmitting || socialLoadingProvider !== null}
            onClick={() => handleSocialLogin("github")}
            type="button"
          >
            {socialLoadingProvider === "github"
              ? "Connexion à GitHub..."
              : "Continuer avec GitHub"}
          </button>
          <button
            className="w-full rounded border border-slate-300 px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-slate-50"
            disabled={isSubmitting || socialLoadingProvider !== null}
            onClick={() => handleSocialLogin("google")}
            type="button"
          >
            {socialLoadingProvider === "google"
              ? "Connexion à Google..."
              : "Continuer avec Google"}
          </button>
        </div>

        {feedback && (
          <p className="mt-6 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">
            {feedback}
          </p>
        )}
      </div>
    </main>
  );
}

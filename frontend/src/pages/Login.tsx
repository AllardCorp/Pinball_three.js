import { useState } from "react";
import { useForm, type FieldErrors as HookFormErrors } from "react-hook-form";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import AuthEntryPanel from "../components/auth/AuthEntryPanel";
import {
  getAuthErrorFeedback,
  getCredentialErrorFeedback,
  type AuthMode,
  type AuthProvider,
  type CredentialFieldErrors,
  type FieldName,
  type FormValues,
} from "../components/auth/auth.shared";
import { useAppMode } from "../hooks/useAppMode";
import { signIn, signUp, useSession } from "../lib/auth-client";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { withMode } = useAppMode();
  const redirectTo = withMode(searchParams.get("redirect") ?? "/dashboard");
  const authError = searchParams.get("error") ?? searchParams.get("code");
  const authProvider = searchParams.get("provider");
  const { data: session, isPending } = useSession();
  const [mode, setMode] = useState<AuthMode>("login");
  const [feedback, setFeedback] = useState<string | null>(() =>
    getAuthErrorFeedback(authError, authProvider),
  );
  const [socialLoadingProvider, setSocialLoadingProvider] =
    useState<AuthProvider | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    clearErrors,
    formState: { errors, isSubmitting, isValid },
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    setFocus,
    watch,
  } = useForm<FormValues>({
    // RHF devient la source de vérité du formulaire.
    // On évite ainsi de dupliquer valeurs, erreurs et soumission dans plusieurs `useState`.
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
    shouldUnregister: true,
  });
  const passwordValue = watch("password", "");

  if (!isPending && session) {
    return <Navigate replace to={redirectTo} />;
  }

  function focusFirstError(errors: HookFormErrors<FormValues>) {
    const fieldOrder: FieldName[] =
      mode === "signup"
        ? ["name", "username", "email", "password"]
        : ["email", "password"];

    for (const field of fieldOrder) {
      if (errors[field]) {
        setFocus(field);
        break;
      }
    }
  }

  function applyServerFieldErrors(fieldErrors: CredentialFieldErrors) {
    let firstFieldInError: FieldName | null = null;

    for (const [field, message] of Object.entries(fieldErrors) as Array<
      [FieldName, string | undefined]
    >) {
      if (!message) {
        continue;
      }

      setError(field, {
        type: "server",
        message,
      });

      if (!firstFieldInError) {
        firstFieldInError = field;
      }
    }

    if (firstFieldInError) {
      setFocus(firstFieldInError);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setFeedback(null);
    setShowPassword(false);
    clearErrors();
    reset({
      ...getValues(),
      name: "",
      username: "",
      password: "",
    });
  }

  async function handleCredentialsSubmit(formValues: FormValues) {
    setFeedback(null);

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
          setFeedback(nextFeedback.feedback);
          applyServerFieldErrors(nextFeedback.fieldErrors);
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
        setFeedback(nextFeedback.feedback);
        applyServerFieldErrors(nextFeedback.fieldErrors);
        return;
      }

      navigate(redirectTo);
    } catch {
      setFeedback("Une erreur inattendue est survenue. Réessaie.");
    }
  }

  async function handleSocialLogin(provider: AuthProvider) {
    setFeedback(null);
    setSocialLoadingProvider(provider);

    const errorCallbackURL = new URL(withMode("/login"), window.location.origin);
    errorCallbackURL.searchParams.set("redirect", redirectTo);
    errorCallbackURL.searchParams.set("provider", provider);

    const result = await signIn.social({
      provider,
      callbackURL: new URL(redirectTo, window.location.origin).toString(),
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
      {/* La page `Login` orchestre le flux :
          lecture du mode, redirect, appels Better Auth et feedback global. */}
      <AuthEntryPanel
        errors={errors}
        feedback={feedback}
        isFormSubmitting={isSubmitting}
        isFormValid={isValid}
        isProvidersDisabled={socialLoadingProvider !== null}
        loadingProvider={socialLoadingProvider}
        mode={mode}
        onCredentialsSubmit={handleSubmit(handleCredentialsSubmit, focusFirstError)}
        onSocialLogin={handleSocialLogin}
        onSwitchMode={switchMode}
        passwordValue={passwordValue}
        register={register}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword((currentValue) => !currentValue)}
      />
    </main>
  );
}

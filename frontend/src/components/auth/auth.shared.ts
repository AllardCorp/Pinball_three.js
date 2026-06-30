// Ce fichier centralise les types et règles métier de l'entrée d'auth.
// Le but est d'éviter de les dupliquer entre `Login` et les futures vues réutilisables.

export type AuthMode = "login" | "signup";
export type AuthProvider = "github" | "google";
export type FieldName = "name" | "username" | "email" | "password";
export type FormValues = Record<FieldName, string>;
export type CredentialFieldErrors = Partial<Record<FieldName, string>>;

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;
export const MIN_PASSWORD_LENGTH = 8;

export function getAuthErrorFeedback(
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

  if (errorCode === "email_not_found") {
    return `${providerLabel} n'a pas transmis d'adresse email. Utilise une connexion par email ou rends ton email visible côté ${providerLabel}.`;
  }

  return "La connexion via le fournisseur tiers a échoué. Réessaie ou choisis une autre méthode.";
}

export function validateName(name: string): string | null {
  if (!name.trim()) {
    return "Veuillez renseigner le nom à afficher.";
  }

  if (name.trim().length < 2) {
    return "Le nom doit contenir au moins 2 caractères.";
  }

  return null;
}

export function validateUsername(username: string): string | null {
  const trimmedUsername = username.trim();

  if (!trimmedUsername) {
    return "Un nom d'utilisateur est requis.";
  }

  if (trimmedUsername.length < MIN_USERNAME_LENGTH) {
    return `Le nom d'utilisateur doit contenir au moins ${MIN_USERNAME_LENGTH} caractères.`;
  }

  if (trimmedUsername.length > MAX_USERNAME_LENGTH) {
    return `Le nom d'utilisateur ne peut pas dépasser ${MAX_USERNAME_LENGTH} caractères.`;
  }

  if (/\s/.test(trimmedUsername)) {
    return "Le nom d'utilisateur ne doit pas contenir d'espaces.";
  }

  return null;
}

export function validateEmail(email: string): string | null {
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

export function validatePassword(password: string): string | null {
  if (!password) {
    return "Le mot de passe est requis.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }

  return null;
}

export function getCredentialErrorFeedback(
  mode: AuthMode,
  errorCode: string | null | undefined,
  message: string | null | undefined,
): { feedback: string | null; fieldErrors: CredentialFieldErrors } {
  const normalizedCode = errorCode?.toLowerCase() ?? "";
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (normalizedCode.includes("username") && normalizedCode.includes("taken")) {
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

  if (normalizedCode.includes("invalid_email") || normalizedMessage.includes("email")) {
    return {
      feedback: null,
      fieldErrors: { email: "Vérifie le format de ton adresse email." },
    };
  }

  if (normalizedCode.includes("password") && normalizedCode.includes("short")) {
    return {
      feedback: null,
      fieldErrors: {
        password: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`,
      },
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

export function getPasswordHint(password: string) {
  if (!password) {
    return "Minimum 8 caractères.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return "Mot de passe trop court.";
  }

  if (password.length < 12) {
    return "Sécurité modérée";
  }

  return "Mot de passe solide comme un flipper en acier !";
}

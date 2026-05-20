import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { authClient, signOut, useSession } from "../lib/auth-client";

type ProfileValues = {
  name: string;
  username: string;
};

type ProfileErrors = Partial<Record<keyof ProfileValues, string>>;

type PasswordValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  revokeOtherSessions: boolean;
};

type PasswordErrors = Partial<Record<"currentPassword" | "newPassword" | "confirmPassword", string>>;

function getInputClass(hasError: boolean) {
  return `w-full rounded border px-3 py-2 outline-none transition focus:ring-2 ${
    hasError
      ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100"
      : "border-slate-300 focus:border-slate-500 focus:ring-slate-200"
  }`;
}

function validateName(name: string): string | null {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "Le nom affiché est requis.";
  }

  if (trimmedName.length < 2) {
    return "Le nom affiché doit contenir au moins 2 caractères.";
  }

  return null;
}

function validateUsername(username: string): string | null {
  const trimmedUsername = username.trim();

  if (!trimmedUsername) {
    return "Le nom d'utilisateur est requis.";
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

function getProfileErrors(values: ProfileValues): ProfileErrors {
  return {
    name: validateName(values.name) ?? undefined,
    username: validateUsername(values.username) ?? undefined,
  };
}

function getPasswordErrors(values: PasswordValues): PasswordErrors {
  const nextErrors: PasswordErrors = {};

  if (!values.currentPassword) {
    nextErrors.currentPassword = "Le mot de passe actuel est requis.";
  }

  if (!values.newPassword) {
    nextErrors.newPassword = "Le nouveau mot de passe est requis.";
  } else if (values.newPassword.length < 8) {
    nextErrors.newPassword = "Le nouveau mot de passe doit contenir au moins 8 caractères.";
  }

  if (!values.confirmPassword) {
    nextErrors.confirmPassword = "La confirmation du mot de passe est requise.";
  } else if (values.confirmPassword !== values.newPassword) {
    nextErrors.confirmPassword = "La confirmation ne correspond pas au nouveau mot de passe.";
  }

  if (
    values.currentPassword &&
    values.newPassword &&
    values.currentPassword === values.newPassword
  ) {
    nextErrors.newPassword = "Choisis un mot de passe different de l'actuel.";
  }

  return nextErrors;
}

function getProfileErrorMessage(errorCode: string | null | undefined, message: string | null | undefined) {
  const normalizedCode = errorCode?.toLowerCase() ?? "";
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (normalizedCode.includes("username") && normalizedCode.includes("taken")) {
    return "Ce nom d'utilisateur est déjà utilisé.";
  }

  if (normalizedCode.includes("invalid_username") || normalizedMessage.includes("username")) {
    return "Le nom d'utilisateur choisi n'est pas valide.";
  }

  return message ?? "Impossible de mettre à jour le profil pour le moment.";
}

function getPasswordErrorMessage(errorCode: string | null | undefined, message: string | null | undefined) {
  const normalizedCode = errorCode?.toLowerCase() ?? "";

  if (
    normalizedCode.includes("invalid_password") ||
    normalizedCode.includes("invalid_credentials")
  ) {
    return "Le mot de passe actuel est incorrect.";
  }

  if (normalizedCode.includes("password") && normalizedCode.includes("short")) {
    return "Le nouveau mot de passe doit contenir au moins 8 caractères.";
  }

  return message ?? "Impossible de changer le mot de passe pour le moment.";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [profileValues, setProfileValues] = useState<ProfileValues>({
    name: "",
    username: "",
  });
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [passwordValues, setPasswordValues] = useState<PasswordValues>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    revokeOtherSessions: false,
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!session) {
      return;
    }

    // On resynchronise le formulaire avec la session courante pour éviter
    // d'afficher d'anciennes valeurs après une mise à jour ou un refresh.
    setProfileValues({
      name: session.user.name ?? "",
      username: session.user.username ?? "",
    });
  }, [session]);

  if (!session) {
    return null;
  }

  const currentUser = session.user;

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = getProfileErrors(profileValues);
    setProfileErrors(nextErrors);
    setProfileFeedback(null);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const normalizedValues = {
      name: profileValues.name.trim(),
      username: profileValues.username.trim(),
    };

    if (
      normalizedValues.name === currentUser.name &&
      normalizedValues.username === (currentUser.username ?? "")
    ) {
      setProfileFeedback("Aucune modification à enregistrer.");
      return;
    }

    setIsSavingProfile(true);

    try {
      const result = await authClient.updateUser(normalizedValues);

      if (result.error) {
        setProfileFeedback(getProfileErrorMessage(result.error.code, result.error.message));
        return;
      }

      setProfileFeedback("Le profil a bien été mis à jour.");
    } catch {
      setProfileFeedback("Une erreur inattendue est survenue pendant la mise à jour du profil.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = getPasswordErrors(passwordValues);
    setPasswordErrors(nextErrors);
    setPasswordFeedback(null);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await authClient.changePassword({
        currentPassword: passwordValues.currentPassword,
        newPassword: passwordValues.newPassword,
        revokeOtherSessions: passwordValues.revokeOtherSessions,
      });

      if (result.error) {
        setPasswordFeedback(getPasswordErrorMessage(result.error.code, result.error.message));
        return;
      }

      // On vide uniquement la partie sécurité pour ne pas perdre les autres saisies
      // si l'utilisateur enchaîne plusieurs actions sur le même écran.
      setPasswordValues({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        revokeOtherSessions: false,
      });
      setPasswordErrors({});
      setPasswordFeedback("Le mot de passe a bien été modifié.");
    } catch {
      setPasswordFeedback("Une erreur inattendue est survenue pendant le changement de mot de passe.");
    } finally {
      setIsChangingPassword(false);
    }
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
          Se déconnecter
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">Utilisateur connecté</h2>
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
            <dd>{currentUser.username ?? "non défini"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-medium">Modifier le profil</h2>
          <p className="mt-1 text-sm text-slate-500">
            Le nom affiché et le nom d'utilisateur peuvent être modifiés ici.
          </p>
        </div>

        <form className="space-y-4" noValidate onSubmit={handleProfileSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Nom affiché</span>
            <input
              autoComplete="name"
              className={getInputClass(Boolean(profileErrors.name))}
              onChange={(event) => {
                setProfileValues((currentValues) => ({
                  ...currentValues,
                  name: event.target.value,
                }));
                setProfileErrors((currentErrors) => ({
                  ...currentErrors,
                  name: undefined,
                }));
              }}
              value={profileValues.name}
            />
            {profileErrors.name && (
              <p className="mt-1 text-xs text-red-600">{profileErrors.name}</p>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Nom d'utilisateur</span>
            <input
              autoCapitalize="none"
              autoCorrect="off"
              className={getInputClass(Boolean(profileErrors.username))}
              onChange={(event) => {
                setProfileValues((currentValues) => ({
                  ...currentValues,
                  username: event.target.value,
                }));
                setProfileErrors((currentErrors) => ({
                  ...currentErrors,
                  username: undefined,
                }));
              }}
              spellCheck={false}
              value={profileValues.username}
            />
            {profileErrors.username ? (
              <p className="mt-1 text-xs text-red-600">{profileErrors.username}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Entre 3 et 15 caractères, sans espaces.
              </p>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Adresse email</span>
            <input
              className="w-full rounded border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500"
              disabled
              readOnly
              value={currentUser.email}
            />
            <p className="mt-1 text-xs text-slate-500">
              L'email n'est pas modifiable ici pour éviter un changement sans vérification.
            </p>
          </label>

          {profileFeedback && (
            <p
              className={`rounded px-3 py-2 text-sm ${
                profileFeedback.includes("bien")
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {profileFeedback}
            </p>
          )}

          <button
            className="rounded bg-slate-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSavingProfile}
            type="submit"
          >
            {isSavingProfile ? "Mise à jour..." : "Enregistrer le profil"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-medium">Sécurité</h2>
          <p className="mt-1 text-sm text-slate-500">
            Utilise le mot de passe actuel pour confirmer un changement sensible.
          </p>
        </div>

        <form className="space-y-4" noValidate onSubmit={handlePasswordSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Mot de passe actuel</span>
            <input
              autoComplete="current-password"
              className={getInputClass(Boolean(passwordErrors.currentPassword))}
              onChange={(event) => {
                setPasswordValues((currentValues) => ({
                  ...currentValues,
                  currentPassword: event.target.value,
                }));
                setPasswordErrors((currentErrors) => ({
                  ...currentErrors,
                  currentPassword: undefined,
                }));
              }}
              type="password"
              value={passwordValues.currentPassword}
            />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-xs text-red-600">{passwordErrors.currentPassword}</p>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Nouveau mot de passe</span>
            <input
              autoComplete="new-password"
              className={getInputClass(Boolean(passwordErrors.newPassword))}
              minLength={8}
              onChange={(event) => {
                setPasswordValues((currentValues) => ({
                  ...currentValues,
                  newPassword: event.target.value,
                }));
                setPasswordErrors((currentErrors) => ({
                  ...currentErrors,
                  newPassword: undefined,
                }));
              }}
              type="password"
              value={passwordValues.newPassword}
            />
            {passwordErrors.newPassword ? (
              <p className="mt-1 text-xs text-red-600">{passwordErrors.newPassword}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Minimum 8 caractères et différent du mot de passe actuel.
              </p>
            )}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Confirmer le nouveau mot de passe</span>
            <input
              autoComplete="new-password"
              className={getInputClass(Boolean(passwordErrors.confirmPassword))}
              onChange={(event) => {
                setPasswordValues((currentValues) => ({
                  ...currentValues,
                  confirmPassword: event.target.value,
                }));
                setPasswordErrors((currentErrors) => ({
                  ...currentErrors,
                  confirmPassword: undefined,
                }));
              }}
              type="password"
              value={passwordValues.confirmPassword}
            />
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{passwordErrors.confirmPassword}</p>
            )}
          </label>

          <label className="flex items-center gap-3 text-sm text-slate-600">
            <input
              checked={passwordValues.revokeOtherSessions}
              className="h-4 w-4 rounded border-slate-300"
              onChange={(event) => {
                setPasswordValues((currentValues) => ({
                  ...currentValues,
                  revokeOtherSessions: event.target.checked,
                }));
              }}
              type="checkbox"
            />
            Fermer aussi les autres sessions ouvertes sur d'autres appareils.
          </label>

          {passwordFeedback && (
            <p
              className={`rounded px-3 py-2 text-sm ${
                passwordFeedback.includes("bien")
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {passwordFeedback}
            </p>
          )}

          <button
            className="rounded bg-slate-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isChangingPassword}
            type="submit"
          >
            {isChangingPassword ? "Mise à jour..." : "Changer le mot de passe"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">Liens utiles</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link className="text-blue-600" to="/">
            Retour à l'accueil
          </Link>
          <Link className="text-blue-600" to="/playfield">
            Ouvrir le Playfield
          </Link>
        </div>
      </section>
    </main>
  );
}

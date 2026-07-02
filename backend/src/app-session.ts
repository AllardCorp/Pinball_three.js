import type { IncomingHttpHeaders } from "node:http";

// Contrat minimal utilisé par l'application après authentification.
// Better Auth renvoie plus d'informations que nécessaire ; on conserve ici
// uniquement ce que les routes utilisent afin de ne pas coupler tout le backend
// au type complet de la librairie.
export type AppSession = {
  session: unknown;
  user: {
    email?: string | null;
    id: string;
    username?: string | null;
  };
};

// Abstraction volontaire pour les tests d'intégration.
// Les routes peuvent demander "qui est connecté ?" sans connaître Better Auth,
// ce qui permet d'injecter facilement une session mockée dans les tests.
export type GetSession = (
  headers: IncomingHttpHeaders,
) => Promise<AppSession | null>;

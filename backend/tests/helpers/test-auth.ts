import type { IncomingHttpHeaders } from "node:http";

import type { RequestHandler } from "express";

type TestSessionUser = {
  email: string;
  id: string;
  username: string | null;
};

type TestSession = {
  session: {
    id: string;
    userId: string;
  };
  user: TestSessionUser;
};

function buildTestSession(
  userId: string,
  email: string,
  username: string | null,
): TestSession {
  return {
    session: {
      id: `session_${userId}`,
      userId,
    },
    user: {
      email,
      id: userId,
      username,
    },
  };
}

export function createTestAuthHarness() {
  // Les tests d'intégration des routes `score-claim` n'ont pas besoin
  // de vérifier Better Auth lui-même. On injecte donc une lecture de session
  // minimale, pilotée par des en-têtes explicites, pour tester notre logique.
  async function getSession(headers: IncomingHttpHeaders) {
    const userIdHeader = headers["x-test-user-id"];

    if (!userIdHeader || Array.isArray(userIdHeader)) {
      return null;
    }

    const emailHeader = headers["x-test-email"];
    const usernameHeader = headers["x-test-username"];

    return buildTestSession(
      userIdHeader,
      typeof emailHeader === "string" ? emailHeader : `${userIdHeader}@example.test`,
      typeof usernameHeader === "string" ? usernameHeader : userIdHeader,
    );
  }

  const authRouteHandler: RequestHandler = (_request, response) => {
    response.status(501).json({
      error: "auth_routes_disabled_in_integration_tests",
    });
  };

  return {
    authRouteHandler,
    getSession,
  };
}

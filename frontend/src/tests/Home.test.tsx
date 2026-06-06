import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import Home from "../pages/Home";

const { signOutMock, useSessionMock, withModeMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  useSessionMock: vi.fn(),
  withModeMock: vi.fn((path: string) => path),
}));

vi.mock("../lib/auth-client", () => ({
  signOut: signOutMock,
  useSession: useSessionMock,
}));

vi.mock("../hooks/useAppMode", () => ({
  useAppMode: () => ({
    isArcadeMode: false,
    isWebMode: true,
    mode: "web",
    withMode: withModeMock,
  }),
}));

describe("Page Home", () => {
  // Petit utilitaire pour entourer le composant du Router nécessaire.
  const renderWithRouter = (component: ReactNode) => {
    return render(<MemoryRouter>{component}</MemoryRouter>);
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockSessionState = (
    session: { user: { email: string; username?: string | null } } | null,
    isPending = false,
  ) => {
    useSessionMock.mockReturnValue({
      data: session,
      isPending,
    });
  };

  it("affiche le titre actuel de la page d'accueil", () => {
    mockSessionState(null);

    renderWithRouter(<Home />);

    expect(screen.getByText("Pinball Three.js")).toBeInTheDocument();
  });

  it("affiche l'etat de chargement de session", () => {
    mockSessionState(null, true);

    renderWithRouter(<Home />);

    expect(screen.getByText("Chargement de la session...")).toBeInTheDocument();
    expect(screen.queryByText("Aucune session active.")).not.toBeInTheDocument();
  });

  it("affiche l'absence de session quand le chargement est termine", () => {
    mockSessionState(null);

    renderWithRouter(<Home />);

    expect(screen.getByText("Aucune session active.")).toBeInTheDocument();
  });

  it("affiche la session active avec email et username", () => {
    mockSessionState({
      user: {
        email: "alice@example.test",
        username: "alice",
      },
    });

    renderWithRouter(<Home />);

    expect(screen.getByText("alice@example.test")).toBeInTheDocument();
    expect(screen.getByText("Username: alice")).toBeInTheDocument();
  });

  it("affiche un username absent", () => {
    mockSessionState({
      user: {
        email: "bob@example.test",
        username: null,
      },
    });

    renderWithRouter(<Home />);

    expect(screen.getByText("Username: non defini")).toBeInTheDocument();
  });

  it("appelle signOut au clic sur le bouton de deconnexion", async () => {
    signOutMock.mockResolvedValue(undefined);
    mockSessionState({
      user: {
        email: "alice@example.test",
        username: "alice",
      },
    });

    renderWithRouter(<Home />);

    fireEvent.click(screen.getByRole("button", { name: "Se déconnecter" }));

    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));
  });
});

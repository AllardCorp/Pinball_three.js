import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import Home from "../pages/Home";

describe("Page Home", () => {
  // Petit utilitaire pour entourer le composant du Router nécessaire.
  const renderWithRouter = (component: React.ReactNode) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it("affiche le titre actuel de la page d'accueil", () => {
    renderWithRouter(<Home />);

    expect(screen.getByText("Pinball Three.js")).toBeInTheDocument();
  });
});

import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AuthGuard from "./components/auth/AuthGuard";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ScoreClaim from "./pages/ScoreClaim";

// Cette constante utilise directement `import.meta.env` pour que Vite/Rollup
// puisse supprimer le chunk `FlipperApp` du build public VPS.
const shouldLoadFlipperApp = import.meta.env.VITE_APP_TARGET !== "public";
const FlipperApp = shouldLoadFlipperApp
  ? lazy(() => import("./FlipperApp"))
  : null;

function PublicApp() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/score-claim" element={<ScoreClaim />} />
      <Route
        path="/dashboard"
        element={
          <AuthGuard>
            <Dashboard />
          </AuthGuard>
        }
      />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}

function App() {
  if (FlipperApp) {
    return (
      <Suspense fallback={null}>
        <FlipperApp />
      </Suspense>
    );
  }

  return (
    // Le build public VPS expose uniquement les pages utiles après scan QR ou
    // connexion. Les routes de jeu restent disponibles dans `FlipperApp`.
    <PublicApp />
  );
}

export default App;

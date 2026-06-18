import { Route, Routes } from "react-router-dom";

import AuthGuard from "./components/auth/AuthGuard";
import Backglass from "./pages/Backglass";
import Dashboard from "./pages/Dashboard";
import DMD from "./pages/DMD";
import FlipperMaker from "./pages/FlipperMaker";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Playfield from "./pages/Playfield";
import ScoreClaim from "./pages/ScoreClaim";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/score-claim" element={<ScoreClaim />} />
      <Route path="/playfield" element={<Playfield />} />
      <Route
        path="/dashboard"
        element={
          <AuthGuard>
            <Dashboard />
          </AuthGuard>
        }
      />
      <Route
        path="/maker"
        element={<FlipperMaker />}
      />
      <Route path="/backglass" element={<Backglass />} />
      <Route path="/dmd" element={<DMD />} />
    </Routes>
  );
}

export default App;

import { Route, Routes } from "react-router-dom";

import AuthGuard from "./components/auth/AuthGuard";
import { MqttProvider } from "./mqtt/mqttContext";
import Backglass from "./pages/Backglass";
import Dashboard from "./pages/Dashboard";
import DMD from "./pages/DMD";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Playfield from "./pages/Playfield";
import ScoreClaim from "./pages/ScoreClaim";

export default function FlipperApp() {
  return (
    // Le provider MQTT est réservé au flipper local. Le VPS public ne doit pas
    // ouvrir de WebSocket MQTT depuis une page HTTPS.
    <MqttProvider>
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
        <Route path="/backglass" element={<Backglass />} />
        <Route path="/dmd" element={<DMD />} />
      </Routes>
    </MqttProvider>
  );
}

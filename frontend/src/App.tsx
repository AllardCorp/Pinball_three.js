import { Route, Routes } from "react-router-dom";

import AuthGuard from "./components/AuthGuard";
import Backglass from "./pages/Backglass";
import Dashboard from "./pages/Dashboard";
import DeviceLogin from "./pages/DeviceLogin";
import DMD from "./pages/DMD";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Playfield from "./pages/Playfield";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/device-login" element={<DeviceLogin />} />
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
  );
}

export default App;

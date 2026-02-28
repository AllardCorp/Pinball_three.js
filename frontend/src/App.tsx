import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Playfield from "./pages/Playfield";
import Backglass from "./pages/Backglass";
import DMD from "./pages/DMD";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/playfield" element={<Playfield />} />
      <Route path="/backglass" element={<Backglass />} />
      <Route path="/dmd" element={<DMD />} />
    </Routes>
  );
}

export default App;

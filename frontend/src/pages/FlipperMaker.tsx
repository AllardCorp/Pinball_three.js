import { Route, Routes } from "react-router-dom";
import MakerEditorPage from "@/pages/maker/MakerEditorPage";
import MakerListPage from "@/pages/maker/MakerListPage";

export default function FlipperMaker() {
  return (
    <Routes>
      <Route index element={<MakerListPage />} />
      <Route path="new" element={<MakerEditorPage mode="create" />} />
      <Route path=":id" element={<MakerEditorPage mode="edit" />} />
    </Routes>
  );
}

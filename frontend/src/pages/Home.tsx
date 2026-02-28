import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col w-full h-screen items-center justify-center gap-6">
      <h2 className="text-3xl font-semibold">Hi 👋</h2>
      <div className="flex gap-4">
        <Link className="hover:text-blue-600" to="/playfield">
          Playfield
        </Link>
        <Link className="hover:text-blue-600" to="/backglass">
          Backglass
        </Link>
        <Link className="hover:text-blue-600" to="/dmd">
          DMD
        </Link>
      </div>
    </div>
  );
}

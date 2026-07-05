import { getMakerElementConfig, type MakerElementType } from "@/config/makerElementConfig";

interface ElementGeometryProps {
  type: MakerElementType;
}

// Traduit la géométrie déclarée dans MAKER_ELEMENT_CONFIG en élément JSX R3F.
// Seul endroit du code qui connaît le mapping "kind" -> balise Three.js.
export function ElementGeometry({ type }: ElementGeometryProps) {
  const config = getMakerElementConfig(type);
  if (!config) return null;

  switch (config.geometry.kind) {
    case "cylinderGeometry":
      return <cylinderGeometry args={config.geometry.args} />;
    case "boxGeometry":
      return <boxGeometry args={config.geometry.args} />;
    case "sphereGeometry":
      return <sphereGeometry args={config.geometry.args} />;
  }
}

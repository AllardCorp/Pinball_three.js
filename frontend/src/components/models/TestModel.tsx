import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { SkeletonUtils } from "three-stdlib";

import type { JSX } from "react";

type Props = JSX.IntrinsicElements["group"];

export default function TestModel(props: Props) {
  const { scene } = useGLTF("/models/PinballMVP.glb");

  // Clone pour éviter les bugs avec les animations / instances
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  clone.traverse((obj) => {
    if (obj.name.includes("coll")) {
      console.log("FOUND COLL:", obj);
    }
  });
  return <primitive object={clone} {...props} />;
}

useGLTF.preload("/models/PinballMVP.glb");

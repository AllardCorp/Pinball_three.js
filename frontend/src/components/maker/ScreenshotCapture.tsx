import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

// ─── Capture screenshot à résolution fixe (indépendant de l'écran) ───────────

const SCREENSHOT_W = 300;
const SCREENSHOT_H = 480;

export function ScreenshotCapture({ onReady }: { onReady: (fn: () => string) => void }) {
  const { gl, scene } = useThree();

  useEffect(() => {
    onReady(() => {
      // Caméra dédiée calibrée pour cadrer le plateau, ratio portrait
      const cam = new THREE.PerspectiveCamera(45, SCREENSHOT_W / SCREENSHOT_H, 0.1, 1000);
      cam.up.set(0, 0, -1); // Force le haut de la caméra vers le haut du plateau (-Z)
      cam.position.set(-0.6, 70, 4.5);
      cam.lookAt(-0.6, -3, 4.5);

      // Rendu dans une texture à résolution fixe, pas liée à l'écran
      const target = new THREE.WebGLRenderTarget(SCREENSHOT_W, SCREENSHOT_H);
      gl.setRenderTarget(target);
      gl.render(scene, cam);
      gl.setRenderTarget(null);

      // Lecture des pixels — WebGL est Y-inversé, on flip verticalement
      const pixels = new Uint8Array(SCREENSHOT_W * SCREENSHOT_H * 4);
      gl.readRenderTargetPixels(target, 0, 0, SCREENSHOT_W, SCREENSHOT_H, pixels);
      target.dispose();

      const canvas = document.createElement("canvas");
      canvas.width = SCREENSHOT_W;
      canvas.height = SCREENSHOT_H;
      const ctx = canvas.getContext("2d")!;
      const imageData = ctx.createImageData(SCREENSHOT_W, SCREENSHOT_H);

      for (let y = 0; y < SCREENSHOT_H; y++) {
        for (let x = 0; x < SCREENSHOT_W; x++) {
          const src = ((SCREENSHOT_H - 1 - y) * SCREENSHOT_W + x) * 4;
          const dst = (y * SCREENSHOT_W + x) * 4;
          imageData.data[dst] = pixels[src];
          imageData.data[dst + 1] = pixels[src + 1];
          imageData.data[dst + 2] = pixels[src + 2];
          imageData.data[dst + 3] = pixels[src + 3];
        }
      }

      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL("image/jpeg", 0.85);
    });
  }, [gl, scene, onReady]);

  return null;
}

// Module responsable de la transformation "asset bitmap -> matrice DMD".
// Le renderer ne dessine ensuite que des patterns de 0/1, ce qui évite de
// refaire des lectures de pixels à chaque animation frame.

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load DMD icon: ${source}`));
    image.src = source;
  });
}

// Convertit une image en motif binaire compatible DMD.
// Les pictos de classes sont préparés en noir sur fond transparent.
// Convention retenue :
// - pixel sombre + suffisamment opaque = diode allumée
// - pixel clair/transparent = diode éteinte
export async function rasterizeImageToDmdPattern(
  source: string,
  width: number,
  height: number,
) {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    // Cas très rare, mais possible si le navigateur refuse le contexte canvas.
    // Le composant appelant affichera alors le fallback codé en dur.
    return null;
  }

  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const pixels = context.getImageData(0, 0, width, height).data;
  const rows: string[] = [];

  for (let y = 0; y < height; y += 1) {
    let row = "";

    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;

      // Seuils volontairement simples : les assets sont préparés pour être
      // noir/transparents, donc on n'a pas besoin d'algorithme complexe.
      row += alpha > 80 && luminance < 55 ? "1" : "0";
    }

    rows.push(row);
  }

  return rows;
}

// Convertit une sprite sheet horizontale noir/blanc en frames DMD.
// Ici les pixels blancs deviennent des diodes, le noir reste transparent.
// Cette conversion est faite au chargement de l'écran, pas pendant le rendu :
// l'animation mine ne coûte ensuite qu'un drawPattern par frame active.
export async function rasterizeSpriteSheetToDmdFrames(
  source: string,
  frameWidth: number,
  frameHeight: number,
  frameCount: number,
) {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    // Même stratégie que les icônes : si la conversion échoue, l'animation est
    // ignorée plutôt que de casser tout l'écran DMD.
    return null;
  }

  canvas.width = frameWidth;
  canvas.height = frameHeight;

  const frames: string[][] = [];

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    context.clearRect(0, 0, frameWidth, frameHeight);
    context.drawImage(
      image,
      // Découpe de la frame source dans la sprite sheet horizontale.
      frameIndex * frameWidth,
      0,
      frameWidth,
      frameHeight,
      0,
      0,
      frameWidth,
      frameHeight,
    );

    const pixels = context.getImageData(0, 0, frameWidth, frameHeight).data;
    const rows: string[] = [];

    for (let y = 0; y < frameHeight; y += 1) {
      let row = "";

      for (let x = 0; x < frameWidth; x += 1) {
        const index = (y * frameWidth + x) * 4;
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const alpha = pixels[index + 3];
        const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;

        // Pour les animations, la convention est inversée par rapport aux
        // icônes : pixel blanc = diode allumée, fond noir = transparent.
        row += alpha > 80 && luminance > 170 ? "1" : "0";
      }

      rows.push(row);
    }

    frames.push(rows);
  }

  return frames;
}

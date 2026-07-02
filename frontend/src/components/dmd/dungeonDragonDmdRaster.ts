function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load DMD asset: ${source}`));
    image.src = source;
  });
}

function getLuminance(red: number, green: number, blue: number) {
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

export async function rasterizeImageToDmdPattern(
  source: string,
  width: number,
  height: number,
) {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
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
      const red = pixels[index] ?? 0;
      const green = pixels[index + 1] ?? 0;
      const blue = pixels[index + 2] ?? 0;
      const alpha = pixels[index + 3] ?? 0;
      const luminance = getLuminance(red, green, blue);

      // Les icônes DMD sont préparées en sombre sur fond transparent.
      // Pixel sombre et opaque = diode allumée.
      row += alpha > 80 && luminance < 55 ? "1" : "0";
    }

    rows.push(row);
  }

  return rows;
}

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
    return null;
  }

  canvas.width = frameWidth;
  canvas.height = frameHeight;

  const frames: string[][] = [];

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    context.clearRect(0, 0, frameWidth, frameHeight);
    context.drawImage(
      image,
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
        const red = pixels[index] ?? 0;
        const green = pixels[index + 1] ?? 0;
        const blue = pixels[index + 2] ?? 0;
        const alpha = pixels[index + 3] ?? 0;
        const luminance = getLuminance(red, green, blue);

        // Les animations sont en noir/blanc : blanc = diode allumée.
        row += alpha > 80 && luminance > 170 ? "1" : "0";
      }

      rows.push(row);
    }

    frames.push(rows);
  }

  return frames;
}

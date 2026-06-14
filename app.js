const fs = require("fs");
const { PNG } = require("pngjs");
const bmp = require("bmp-js");

/**
 * Decode base64 → string → pixel array
 */
const parseBase64Pixels = (base64) =>
  Buffer.from(base64, "base64")
    .toString("utf-8")
    .split(",")
    .map(v => parseInt(v.trim(), 10))
    .filter(Number.isFinite);

/**
 * Validate pixel buffer
 */
const assertPixels = (pixels, { width, height, channels = 3 }) => {
  const expected = width * height * channels;
  if (pixels.length !== expected) {
    throw new Error(`Expected ${expected} values, got ${pixels.length}`);
  }
};

/**
 * Convert RGB → RGBA (shared logic)
 */
const toRGBA = (rgb) => {
  const rgba = Buffer.alloc((rgb.length / 3) * 4);
  let i = 0, j = 0;

  while (i < rgb.length) {
    rgba[j++] = rgb[i++]; // R
    rgba[j++] = rgb[i++]; // G
    rgba[j++] = rgb[i++]; // B
    rgba[j++] = 255;      // A
  }

  return rgba;
};

/**
 * Write PNG
 */
const writePNG = (rgba, { width, height, path }) =>
  new Promise((resolve, reject) => {
    const png = new PNG({ width, height });
    png.data = rgba;

    png.pack()
      .pipe(fs.createWriteStream(path))
      .on("finish", resolve)
      .on("error", reject);
  });

/**
 * Write BMP
 */
const writeBMP = (rgba, { width, height, path }) => {
  const data = bmp.encode({ data: rgba, width, height });
  fs.writeFileSync(path, data.data);
};

/**
 * File → Base64
 */
const toBase64 = (path) =>
  fs.readFileSync(path).toString("base64");

/**
 * Pipeline
 */
async function generate({ base64, width, height }) {
  const pixels = parseBase64Pixels(base64);

  assertPixels(pixels, { width, height });

  const rgba = toRGBA(pixels);

  const outputs = {
    png: "output.png",
    bmp: "output.bmp"
  };

  await writePNG(rgba, { ...outputs, path: outputs.png });
  writeBMP(rgba, { ...outputs, path: outputs.bmp });

  return {
    png: toBase64(outputs.png),
    bmp: toBase64(outputs.bmp)
  };
}

/**
 * Example
 */
(async () => {
  const pixelString = "255,0,0, 0,255,0, 0,0,255, 255,255,0";
  const base64 = Buffer.from(pixelString).toString("base64");

  const result = await generate({
    base64,
    width: 2,
    height: 2
  });

  console.log("PNG Base64:\n", result.png);
  console.log("\nBMP Base64:\n", result.bmp);
})();

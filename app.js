const fs = require("fs");
const { PNG } = require("pngjs");
const bmp = require("bmp-js");

/**
 * Decode base64 → pixel array
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
const assertPixels = (pixels, width, height, channels = 3) => {
  const expected = width * height * channels;
  if (pixels.length !== expected) {
    throw new Error(`Expected ${expected} values, got ${pixels.length}`);
  }
};

/**
 * RGB → RGBA
 */
const toRGBA = (rgb) => {
  const rgba = Buffer.alloc((rgb.length / 3) * 4);

  for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) {
    rgba[j]     = rgb[i];
    rgba[j + 1] = rgb[i + 1];
    rgba[j + 2] = rgb[i + 2];
    rgba[j + 3] = 255;
  }

  return rgba;
};

/**
 * Encode PNG → Buffer
 */
const encodePNG = (rgba, width, height) =>
  new Promise((resolve, reject) => {
    const png = new PNG({ width, height });
    png.data = rgba;

    const chunks = [];

    png.pack()
      .on("data", chunk => chunks.push(chunk))
      .on("end", () => resolve(Buffer.concat(chunks)))
      .on("error", reject);
  });

/**
 * Encode BMP → Buffer
 */
const encodeBMP = (rgba, width, height) =>
  bmp.encode({ data: rgba, width, height }).data;

/**
 * Save helper (optional)
 */
const save = (path, buffer) => fs.writeFileSync(path, buffer);

/**
 * Core pipeline (pure)
 */
async function generate({ base64, width, height, writeFiles = true }) {
  const pixels = parseBase64Pixels(base64);

  assertPixels(pixels, width, height);

  const rgba = toRGBA(pixels);

  const pngBuffer = await encodePNG(rgba, width, height);
  const bmpBuffer = encodeBMP(rgba, width, height);

  if (writeFiles) {
    save("output.png", pngBuffer);
    save("output.bmp", bmpBuffer);
  }

  return {
    png: pngBuffer.toString("base64"),
    bmp: bmpBuffer.toString("base64"),
    buffers: {
      png: pngBuffer,
      bmp: bmpBuffer
    }
  };
}

/**
 * Example (CLI-style entry)
 */
async function main() {
  const width = 2;
  const height = 2;

  const pixelString = "255,0,0, 0,255,0, 0,0,255, 255,255,0";
  const base64 = Buffer.from(pixelString).toString("base64");

  const result = await generate({ base64, width, height });

  console.log("PNG Base64:\n", result.png);
  console.log("\nBMP Base64:\n", result.bmp);
}

if (require.main === module) {
  main().catch(err => {
    console.error("❌", err.message);
    process.exit(1);
  });
}

const fs = require("fs");
const { PNG } = require("pngjs");

/**
 * Convert input string → pixel array
 * Example input: "255,0,0, 0,255,0, 0,0,255"
 */
function parsePixelString(input) {
  return input
    .split(",")
    .map(v => parseInt(v.trim(), 10))
    .filter(v => !isNaN(v));
}

/**
 * Create PNG from RGB pixel array
 */
function createImage(pixels, width, height, outputFile) {
  const png = new PNG({ width, height });

  const expectedLength = width * height * 3;
  if (pixels.length !== expectedLength) {
    throw new Error(
      `Invalid pixel data length. Expected ${expectedLength}, got ${pixels.length}`
    );
  }

  let pxIndex = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;

      png.data[idx]     = pixels[pxIndex++]; // R
      png.data[idx + 1] = pixels[pxIndex++]; // G
      png.data[idx + 2] = pixels[pxIndex++]; // B
      png.data[idx + 3] = 255;               // A
    }
  }

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(outputFile);
    png.pack().pipe(stream);

    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });
}

/**
 * Convert file → Base64
 */
function fileToBase64(path) {
  const buffer = fs.readFileSync(path);
  return buffer.toString("base64");
}

/**
 * MAIN
 */
async function main() {
    const input = "255,0,0, 0,255,0, 0,0,255, 255,255,0";

    const width = 2;
    const height = 2;

    const outputFile = "output.png";

    try {
        const pixels = parsePixelString(input);

        await createImage(pixels, width, height, outputFile);

        console.log("✅ Image saved:", outputFile);

        const base64 = fileToBase64(outputFile);

        console.log("\n📦 Base64:");
        console.log(base64);
    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

main();

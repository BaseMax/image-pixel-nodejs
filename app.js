const fs = require("fs");
const { PNG } = require("pngjs");
const bmp = require("bmp-js");

/**
 * Step 1: Decode Base64 → string
 */
function decodeBase64ToString(base64) {
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Step 2: Convert string → pixel array
 * Supports: "255,0,0, 0,255,0, ..."
 */
function parsePixelString(input) {
  return input
    .split(",")
    .map(v => parseInt(v.trim(), 10))
    .filter(v => !isNaN(v));
}

/**
 * Step 3: Validate pixel buffer
 */
function validatePixels(pixels, width, height, channels = 3) {
  const expected = width * height * channels;
  if (pixels.length !== expected) {
    throw new Error(
      `Invalid pixel length: expected ${expected}, got ${pixels.length}`
    );
  }
}

/**
 * Step 4: Create PNG
 */
function createPNG(pixels, width, height, outputPath) {
  return new Promise((resolve, reject) => {
    const png = new PNG({ width, height });

    let p = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;

        png.data[idx]     = pixels[p++]; // R
        png.data[idx + 1] = pixels[p++]; // G
        png.data[idx + 2] = pixels[p++]; // B
        png.data[idx + 3] = 255;         // A
      }
    }

    const stream = fs.createWriteStream(outputPath);
    png.pack().pipe(stream);

    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

/**
 * Step 5: Create BMP
 */
function createBMP(pixels, width, height, outputPath) {
  const rgbaBuffer = Buffer.alloc(width * height * 4);

  let p = 0;

  for (let i = 0; i < width * height; i++) {
    rgbaBuffer[i * 4]     = pixels[p++]; // R
    rgbaBuffer[i * 4 + 1] = pixels[p++]; // G
    rgbaBuffer[i * 4 + 2] = pixels[p++]; // B
    rgbaBuffer[i * 4 + 3] = 255;         // A
  }

  const rawData = {
    data: rgbaBuffer,
    width,
    height
  };

  const bmpData = bmp.encode(rawData);
  fs.writeFileSync(outputPath, bmpData.data);
}

/**
 * Step 6: File → Base64
 */
function fileToBase64(path) {
  return fs.readFileSync(path).toString("base64");
}

/**
 * MAIN PIPELINE
 */
async function generateImagesFromBase64(base64Input, width, height) {
  try {
    const decoded = decodeBase64ToString(base64Input);

    const pixels = parsePixelString(decoded);

    validatePixels(pixels, width, height, 3);

    const pngFile = "output.png";
    const bmpFile = "output.bmp";

    await createPNG(pixels, width, height, pngFile);
    createBMP(pixels, width, height, bmpFile);

    console.log("✅ PNG + BMP generated");

    const pngBase64 = fileToBase64(pngFile);
    const bmpBase64 = fileToBase64(bmpFile);

    console.log("\n📦 PNG Base64:\n", pngBase64);
    console.log("\n📦 BMP Base64:\n", bmpBase64);

  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

/**
 * EXAMPLE
 */

const pixelString = "255,0,0, 0,255,0, 0,0,255, 255,255,0";

const base64Input = Buffer.from(pixelString).toString("base64");

const width = 2;
const height = 2;

generateImagesFromBase64(base64Input, width, height);

const { Readable }   = require("stream");
const { generate }   = require("./src/pipeline");
const { wasmEncode, wasmBackend } = require("./src/encoders/wasmEncoder");

async function main() {
  const width  = 2;
  const height = 2;
  const pixelString = "255,0,0, 0,255,0, 0,0,255, 255,255,0";

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Base64 input  (original behavior, writes PNG + BMP to disk)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("─── 1. Base64 input ──────────────────────────────────────────");
  const base64 = Buffer.from(pixelString).toString("base64");
  const r1 = await generate({ base64, width, height, formats: ["png", "bmp"], writeFiles: true });
  console.log("PNG bytes:", r1.buffers.png.length, " → output.png");
  console.log("BMP bytes:", r1.buffers.bmp.length, " → output.bmp");

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Binary input  (fastest path — raw RGB bytes, no CSV/Base64 overhead)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n─── 2. Binary input ─────────────────────────────────────────");
  const binary = Buffer.from([255,0,0, 0,255,0, 0,0,255, 255,255,0]);
  const r2 = await generate({ binary, width, height, formats: ["png", "jpeg", "webp"] });
  console.log("PNG  bytes:", r2.buffers.png.length);
  console.log("JPEG bytes:", r2.buffers.jpeg.length);
  console.log("WebP bytes:", r2.buffers.webp.length);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Streaming input  (low-memory path for large images)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n─── 3. Streaming input ──────────────────────────────────────");
  const readable = Readable.from([pixelString]);
  const r3 = await generate({ stream: readable, width, height, formats: ["png"] });
  console.log("PNG from stream, bytes:", r3.buffers.png.length);

  // ─────────────────────────────────────────────────────────────────────────
  // 4. JPEG + WebP output with quality options
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n─── 4. JPEG + WebP output ───────────────────────────────────");
  const r4 = await generate({
    base64,
    width,
    height,
    formats: ["jpeg", "webp"],
    writeFiles: true,
    encodeOptions: { jpeg: { quality: 85 }, webp: { quality: 75 } }
  });
  console.log("JPEG bytes:", r4.buffers.jpeg.length, " → output.jpg");
  console.log("WebP bytes:", r4.buffers.webp.length, " → output.webp");

  // ─────────────────────────────────────────────────────────────────────────
  // 5. WASM encoder  (tries @img/sharp-wasm32, falls back to native sharp)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n─── 5. WASM encoder ─────────────────────────────────────────");
  console.log("Backend:", wasmBackend);
  const rgbaDemo = Buffer.from([
    255, 0,   0,   255,
    0,   255, 0,   255,
    0,   0,   255, 255,
    255, 255, 0,   255,
  ]);
  const wasmPNG  = await wasmEncode(rgbaDemo, width, height, "png");
  const wasmJPEG = await wasmEncode(rgbaDemo, width, height, "jpeg", { quality: 90 });
  const wasmWebP = await wasmEncode(rgbaDemo, width, height, "webp", { lossless: true });
  console.log("WASM PNG  bytes:", wasmPNG.length);
  console.log("WASM JPEG bytes:", wasmJPEG.length);
  console.log("WASM WebP bytes:", wasmWebP.length);

  console.log("\nDone.");
}

main().catch(err => {
  console.error("❌", err.message);
  process.exit(1);
});

/**
 * WASM-backed encoder.
 *
 * Resolution order:
 *   1. @img/sharp-wasm32  — true WebAssembly build of sharp (no native bindings)
 *   2. sharp              — native libvips build (pre-compiled C, same API)
 *
 * Install the WASM build for environments without native addon support:
 *   npm install @img/sharp-wasm32
 */
let sharpImpl;
let wasmBackend;

try {
  sharpImpl = require("@img/sharp-wasm32");
  wasmBackend = "wasm32";
} catch {
  try {
    sharpImpl = require("sharp");
    wasmBackend = "native";
  } catch {
    sharpImpl = null;
    wasmBackend = "unavailable";
  }
}

const SUPPORTED = new Set(["png", "jpeg", "jpg", "webp"]);

/**
 * Encode an RGBA buffer to the target format using the WASM (or native) backend.
 * @param {Buffer} rgba       - RGBA pixel data (4 bytes per pixel)
 * @param {number} width
 * @param {number} height
 * @param {"png"|"jpeg"|"webp"} format
 * @param {object} [opts]     - Format-specific options (quality, lossless, …)
 */
const wasmEncode = (rgba, width, height, format = "png", opts = {}) => {
  if (!sharpImpl) {
    return Promise.reject(
      new Error("No encoder available. Install: npm install @img/sharp-wasm32   or   npm install sharp")
    );
  }
  if (!SUPPORTED.has(format)) {
    return Promise.reject(
      new Error(`wasmEncoder: unsupported format "${format}". Supported: ${[...SUPPORTED].join(", ")}`)
    );
  }

  const pipe = sharpImpl(rgba, { raw: { width, height, channels: 4 } });

  if (format === "png")             return pipe.png(opts).toBuffer();
  if (format === "jpeg" || format === "jpg")
                                    return pipe.jpeg({ quality: opts.quality ?? 90, ...opts }).toBuffer();
  if (format === "webp")            return pipe.webp({ quality: opts.quality ?? 80, ...opts }).toBuffer();
};

module.exports = { wasmEncode, wasmBackend };

const fs   = require("fs");
const path = require("path");

const { parseBase64Pixels }            = require("./parsers/base64Parser");
const { parseBinaryToRGBA }            = require("./parsers/binaryParser");
const { collectStreamPixels }          = require("./parsers/streamingParser");
const { encodePNG }                    = require("./encoders/pngEncoder");
const { encodeBMP }                    = require("./encoders/bmpEncoder");
const { encodeJPEG }                   = require("./encoders/jpegEncoder");
const { encodeWebP }                   = require("./encoders/webpEncoder");

const assertPixels = (pixels, width, height) => {
  const expected = width * height * 3;
  if (pixels.length !== expected) {
    throw new Error(
      `Expected ${expected} values (${width}×${height}×3), got ${pixels.length}`
    );
  }
};

const rgbToRGBA = (rgb) => {
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
 * Generate images from pixel data.
 *
 * Input (pick one):
 *   base64   {string}   Base64-encoded CSV pixels  (original)
 *   binary   {Buffer}   Raw RGB bytes              (fastest)
 *   stream   {Readable} CSV stream                 (low-memory)
 *
 * @param {object} opts
 * @param {string}   [opts.base64]
 * @param {Buffer}   [opts.binary]
 * @param {import("stream").Readable} [opts.stream]
 * @param {number}    opts.width
 * @param {number}    opts.height
 * @param {string[]} [opts.formats=["png","bmp"]]   Any of: png bmp jpeg webp
 * @param {boolean}  [opts.writeFiles=false]
 * @param {string}   [opts.outputDir="."]
 * @param {object}   [opts.encodeOptions]           Per-format options {jpeg:{quality},webp:{…}}
 */
async function generate({
  base64,
  binary,
  stream,
  width,
  height,
  formats      = ["png", "bmp"],
  writeFiles   = false,
  outputDir    = ".",
  encodeOptions = {}
}) {
  let rgba;

  if (binary) {
    rgba = parseBinaryToRGBA(binary, width, height);
  } else if (stream) {
    const pixels = await collectStreamPixels(stream);
    assertPixels(pixels, width, height);
    rgba = rgbToRGBA(pixels);
  } else if (base64) {
    const pixels = parseBase64Pixels(base64);
    assertPixels(pixels, width, height);
    rgba = rgbToRGBA(pixels);
  } else {
    throw new Error("Provide one of: base64, binary, or stream");
  }

  const fmts   = new Set(formats.map(f => f.toLowerCase()));
  const result = { buffers: {} };

  const save = (name, buf) => {
    if (writeFiles) fs.writeFileSync(path.join(outputDir, name), buf);
  };

  await Promise.all([
    fmts.has("png") &&
      encodePNG(rgba, width, height).then(buf => {
        result.buffers.png = buf;
        result.png = buf.toString("base64");
        save("output.png", buf);
      }),

    fmts.has("bmp") &&
      Promise.resolve(encodeBMP(rgba, width, height)).then(buf => {
        result.buffers.bmp = buf;
        result.bmp = buf.toString("base64");
        save("output.bmp", buf);
      }),

    (fmts.has("jpeg") || fmts.has("jpg")) &&
      encodeJPEG(rgba, width, height, encodeOptions.jpeg).then(buf => {
        result.buffers.jpeg = buf;
        result.jpeg = buf.toString("base64");
        save("output.jpg", buf);
      }),

    fmts.has("webp") &&
      encodeWebP(rgba, width, height, encodeOptions.webp).then(buf => {
        result.buffers.webp = buf;
        result.webp = buf.toString("base64");
        save("output.webp", buf);
      }),
  ].filter(Boolean));

  return result;
}

module.exports = { generate, rgbToRGBA, assertPixels };

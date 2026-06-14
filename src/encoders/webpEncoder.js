let sharp;
try { sharp = require("sharp"); } catch { sharp = null; }

/**
 * Encode RGBA buffer to WebP via sharp (libvips).
 * @param {Buffer} rgba
 * @param {number} width
 * @param {number} height
 * @param {{ quality?: number, lossless?: boolean }} [opts]
 */
const encodeWebP = (rgba, width, height, opts = {}) => {
  if (!sharp) {
    return Promise.reject(new Error("Install 'sharp' to use WebP encoding: npm install sharp"));
  }
  return sharp(rgba, { raw: { width, height, channels: 4 } })
    .webp({ quality: opts.quality ?? 80, lossless: opts.lossless ?? false })
    .toBuffer();
};

module.exports = { encodeWebP };

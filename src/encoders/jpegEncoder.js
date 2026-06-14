let sharp;
try { sharp = require("sharp"); } catch { sharp = null; }

/**
 * Encode RGBA buffer to JPEG via sharp (libvips).
 * @param {Buffer} rgba
 * @param {number} width
 * @param {number} height
 * @param {{ quality?: number, progressive?: boolean }} [opts]
 */
const encodeJPEG = (rgba, width, height, opts = {}) => {
  if (!sharp) {
    return Promise.reject(new Error("Install 'sharp' to use JPEG encoding: npm install sharp"));
  }
  return sharp(rgba, { raw: { width, height, channels: 4 } })
    .jpeg({ quality: opts.quality ?? 90, progressive: opts.progressive ?? false })
    .toBuffer();
};

module.exports = { encodeJPEG };

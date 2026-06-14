/**
 * Parse raw binary RGB buffer (3 bytes per pixel, no encoding overhead).
 * This is the fastest input path — no CSV parsing, no Base64 decode.
 */
const parseBinaryToRGBA = (buffer, width, height) => {
  if (!Buffer.isBuffer(buffer)) throw new TypeError("binary input must be a Buffer");

  const expected = width * height * 3;
  if (buffer.length !== expected) {
    throw new Error(
      `Expected ${expected} bytes for ${width}×${height} RGB image, got ${buffer.length}`
    );
  }

  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0, j = 0; i < buffer.length; i += 3, j += 4) {
    rgba[j]     = buffer[i];
    rgba[j + 1] = buffer[i + 1];
    rgba[j + 2] = buffer[i + 2];
    rgba[j + 3] = 255;
  }
  return rgba;
};

module.exports = { parseBinaryToRGBA };

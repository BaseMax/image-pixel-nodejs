const { Transform } = require("stream");

/**
 * Transform stream: reads comma-separated CSV pixel data in arbitrary chunks,
 * reassembles split tokens, and emits one validated integer per push.
 * Suitable for large pixel datasets that shouldn't be loaded entirely in memory.
 */
class PixelStreamParser extends Transform {
  constructor(options = {}) {
    super({ ...options, readableObjectMode: true });
    this._partial = "";
  }

  _transform(chunk, _encoding, callback) {
    const tokens = (this._partial + chunk.toString("utf-8")).split(",");
    this._partial = tokens.pop() ?? "";

    for (const token of tokens) {
      const val = parseInt(token.trim(), 10);
      if (Number.isFinite(val) && val >= 0 && val <= 255) this.push(val);
    }
    callback();
  }

  _flush(callback) {
    const tail = this._partial.trim();
    if (tail) {
      const val = parseInt(tail, 10);
      if (Number.isFinite(val) && val >= 0 && val <= 255) this.push(val);
    }
    this._partial = "";
    callback();
  }
}

/** Collect all pixel integers from a readable stream of CSV data. */
const collectStreamPixels = (readable) =>
  new Promise((resolve, reject) => {
    const parser = new PixelStreamParser();
    const pixels = [];
    readable
      .pipe(parser)
      .on("data", v => pixels.push(v))
      .on("end", () => resolve(pixels))
      .on("error", reject);
  });

module.exports = { PixelStreamParser, collectStreamPixels };

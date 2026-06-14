const parseBase64Pixels = (base64) =>
  Buffer.from(base64, "base64")
    .toString("utf-8")
    .split(",")
    .map(v => parseInt(v.trim(), 10))
    .filter(v => Number.isFinite(v) && v >= 0 && v <= 255);

module.exports = { parseBase64Pixels };

const { PNG } = require("pngjs");

const encodePNG = (rgba, width, height) =>
  new Promise((resolve, reject) => {
    const png = new PNG({ width, height });
    png.data = rgba;
    const chunks = [];
    png.pack()
      .on("data", c => chunks.push(c))
      .on("end", () => resolve(Buffer.concat(chunks)))
      .on("error", reject);
  });

module.exports = { encodePNG };

const bmp = require("bmp-js");

const encodeBMP = (rgba, width, height) =>
  bmp.encode({ data: rgba, width, height }).data;

module.exports = { encodeBMP };

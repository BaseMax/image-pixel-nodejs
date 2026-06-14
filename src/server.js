const express = require("express");
const { generate } = require("./pipeline");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.raw({ type: "application/octet-stream", limit: "50mb" }));

// ── Health ────────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) =>
  res.json({ status: "ok", version: "2.0.0" })
);

// ── POST /generate  (JSON body, base64 input) ─────────────────────────────────
//
//  Body: {
//    base64: string,
//    width: number,
//    height: number,
//    formats?: string[],           // ["png","bmp","jpeg","webp"]
//    encodeOptions?: {
//      jpeg?: { quality?: number },
//      webp?: { quality?: number, lossless?: boolean }
//    }
//  }

app.post("/generate", async (req, res) => {
  try {
    const { base64, width, height, formats = ["png", "bmp"], encodeOptions } = req.body;

    if (!base64 || !width || !height) {
      return res.status(400).json({ error: "base64, width, and height are required" });
    }

    const result = await generate({ base64, width, height, formats, encodeOptions });
    const { buffers, ...output } = result;
    res.json(output);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── POST /generate/binary  (raw RGB bytes) ────────────────────────────────────
//
//  Content-Type: application/octet-stream
//  Query params: width, height, formats (comma-separated, default "png,bmp")

app.post("/generate/binary", async (req, res) => {
  try {
    const w       = parseInt(req.query.width,  10);
    const h       = parseInt(req.query.height, 10);
    const formats = (req.query.formats ?? "png,bmp").split(",").map(s => s.trim());

    if (!w || !h) {
      return res.status(400).json({ error: "width and height query params are required" });
    }

    const result = await generate({ binary: req.body, width: w, height: h, formats });
    const { buffers, ...output } = result;
    res.json(output);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── POST /generate/stream  (streaming CSV pixels) ────────────────────────────
//
//  Content-Type: text/plain  (or text/csv)
//  Query params: width, height, formats (comma-separated, default "png,bmp")
//  Body: streamed "R,G,B, R,G,B, …"

app.post("/generate/stream", async (req, res) => {
  try {
    const w       = parseInt(req.query.width,  10);
    const h       = parseInt(req.query.height, 10);
    const formats = (req.query.formats ?? "png,bmp").split(",").map(s => s.trim());

    if (!w || !h) {
      return res.status(400).json({ error: "width and height query params are required" });
    }

    const result = await generate({ stream: req, width: w, height: h, formats });
    const { buffers, ...output } = result;
    res.json(output);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

const start = (port = 3000) =>
  new Promise(resolve => {
    const server = app.listen(port, () => {
      console.log(`Image Pixel API  →  http://localhost:${port}`);
      console.log("  POST /generate          JSON body { base64, width, height, formats? }");
      console.log("  POST /generate/binary   raw RGB bytes  ?width=N&height=N&formats=png,jpeg");
      console.log("  POST /generate/stream   CSV stream     ?width=N&height=N&formats=png,bmp");
      console.log("  GET  /health");
      resolve(server);
    });
  });

if (require.main === module) {
  start(process.env.PORT ?? 3000);
}

module.exports = { app, start };

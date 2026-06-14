# image-pixel-nodejs

A minimal, clean, and efficient Node.js pipeline to generate images (**PNG**, **BMP**, **JPEG**, **WebP**) from raw pixel data.

Supports Base64, raw binary, and streaming input — with a built-in REST API.

---

## ✨ Features

* Multiple **input formats**: Base64 CSV, raw binary buffer, or readable stream
* Multiple **output formats**: PNG, BMP, JPEG, WebP (any combination)
* **Streaming parser** for large pixel datasets (low memory)
* **Binary input** path — no CSV/Base64 overhead, fastest ingestion
* **REST API** (Express) with JSON, binary, and streaming endpoints
* **WASM encoder** — uses `@img/sharp-wasm32` when available, falls back to native `sharp`
* All encodings run in parallel via `Promise.all`
* Clean, DRY, and composable architecture

---

## 📦 Installation

```bash
git clone https://github.com/BaseMax/image-pixel-nodejs.git
cd image-pixel-nodejs
npm install
```

Optional — true WebAssembly encoder (no native bindings required):

```bash
npm install @img/sharp-wasm32
```

---

## 🚀 Usage

### CLI demo (all features)

```bash
node app.js
```

### REST API server

```bash
node src/server.js
# or
npm run server
```

---

## 📥 Input Formats

### 1. Base64 (original)

```text
Base64-encoded comma-separated RGB values:
"255,0,0, 0,255,0, 0,0,255, 255,255,0"
```

### 2. Binary (fastest)

Raw RGB bytes — 3 bytes per pixel, no encoding overhead.

```js
const binary = Buffer.from([255, 0, 0,   0, 255, 0,   0, 0, 255,   255, 255, 0]);
```

### 3. Stream (low-memory)

Any `Readable` that emits comma-separated RGB integers. The parser reassembles tokens split across chunk boundaries.

---

## ⚙️ Pipeline API

### `generate(options)` — `src/pipeline.js`

```js
const { generate } = require("./src/pipeline");

const result = await generate({
  base64,           // string  — Base64-encoded CSV pixels
  // binary,        // Buffer  — raw RGB bytes  (pick one of the three)
  // stream,        // Readable — CSV stream
  width:  2,
  height: 2,
  formats: ["png", "bmp", "jpeg", "webp"],  // any subset
  writeFiles: true,          // save files to outputDir (default: false)
  outputDir: ".",            // where to save (default: ".")
  encodeOptions: {
    jpeg: { quality: 90, progressive: false },
    webp: { quality: 80, lossless: false }
  }
});
```

#### Returns

```js
{
  png:  string,   // Base64 (if requested)
  bmp:  string,
  jpeg: string,
  webp: string,
  buffers: {
    png:  Buffer,
    bmp:  Buffer,
    jpeg: Buffer,
    webp: Buffer,
  }
}
```

---

## 🌐 REST API

Start the server:

```bash
node src/server.js        # default port 3000
PORT=8080 node src/server.js
```

### `GET /health`

```json
{ "status": "ok", "version": "2.0.0" }
```

### `POST /generate` — Base64 JSON input

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "base64": "MjU1LDAsMCwgMCwyNTUsMCwgMCwwLDI1NSwgMjU1LDI1NSww",
    "width": 2,
    "height": 2,
    "formats": ["png", "jpeg", "webp"],
    "encodeOptions": { "jpeg": { "quality": 85 } }
  }'
```

### `POST /generate/binary` — Raw RGB bytes

```bash
curl -X POST \
  "http://localhost:3000/generate/binary?width=2&height=2&formats=png,jpeg" \
  -H "Content-Type: application/octet-stream" \
  --data-binary $'\xff\x00\x00\x00\xff\x00\x00\x00\xff\xff\xff\x00'
```

### `POST /generate/stream` — Streaming CSV pixels

```bash
echo "255,0,0, 0,255,0, 0,0,255, 255,255,0" | \
  curl -X POST \
    "http://localhost:3000/generate/stream?width=2&height=2&formats=png,bmp" \
    -H "Content-Type: text/plain" \
    --data-binary @-
```

---

## 🔩 WASM Encoder

`src/encoders/wasmEncoder.js` resolves the encoder at startup:

1. **`@img/sharp-wasm32`** — true WebAssembly build (no native addons, works in restricted environments)
2. **`sharp`** — native libvips build (fallback)

```js
const { wasmEncode, wasmBackend } = require("./src/encoders/wasmEncoder");

console.log(wasmBackend); // "wasm32" or "native"

const png  = await wasmEncode(rgbaBuffer, width, height, "png");
const jpeg = await wasmEncode(rgbaBuffer, width, height, "jpeg", { quality: 90 });
const webp = await wasmEncode(rgbaBuffer, width, height, "webp", { lossless: true });
```

---

## 📐 Constraint

```
pixels.length === width × height × 3   (for base64 / stream inputs)
buffer.length === width × height × 3   (for binary input)
```

---

## 🧠 Pipeline

```
Input (base64 / binary / stream)
  ↓
Parse & validate
  ↓
RGB → RGBA
  ↓
Parallel encode → PNG + BMP + JPEG + WebP
  ↓
(Optional) save to disk
  ↓
Return { base64 strings + raw Buffers }
```

---

## 📁 Project Structure

```
.
├── app.js                     CLI demo (all features)
├── src/
│   ├── pipeline.js            Core generate() function
│   ├── server.js              Express REST API
│   ├── parsers/
│   │   ├── base64Parser.js    Base64 → pixel array
│   │   ├── binaryParser.js    Raw Buffer → RGBA
│   │   └── streamingParser.js Transform stream for CSV pixels
│   └── encoders/
│       ├── pngEncoder.js      pngjs
│       ├── bmpEncoder.js      bmp-js
│       ├── jpegEncoder.js     sharp (JPEG)
│       ├── webpEncoder.js     sharp (WebP)
│       └── wasmEncoder.js     @img/sharp-wasm32 → sharp fallback
├── package.json
└── README.md
```

---

## ⚡ Performance Notes

| Input       | Overhead        | Best for               |
|-------------|-----------------|------------------------|
| binary      | none            | server-to-server calls |
| base64      | decode + CSV    | general use            |
| stream      | chunked CSV     | large images           |

| Encoder     | Backend         | Formats          |
|-------------|-----------------|------------------|
| pngEncoder  | pngjs (pure JS) | PNG              |
| bmpEncoder  | bmp-js (pure JS)| BMP              |
| jpegEncoder | sharp / libvips | JPEG             |
| webpEncoder | sharp / libvips | WebP             |
| wasmEncoder | sharp-wasm32    | PNG, JPEG, WebP  |

---

## ⭐ Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📜 License

GPL-3.0 License

Copyright (c) 2026 **Seyyed Ali Mohammadiyeh (Max Base)**

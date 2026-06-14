# image-pixel-nodejs

A minimal, clean, and efficient Node.js pipeline to generate images (**PNG** and **BMP**) from raw pixel data.

This project converts a Base64-encoded pixel buffer into an image, saves it, and returns Base64-encoded outputs.

---

## ✨ Features

* Convert **Base64 → pixel buffer → image**
* Supports **PNG** and **BMP**
* Clean, DRY, and composable architecture
* Works fully in-memory (optional file output)
* Simple and extensible pipeline design

---

## 📦 Installation

```bash
git clone https://github.com/BaseMax/image-pixel-nodejs.git
cd image-pixel-nodejs
npm install
```

---

## 🚀 Usage

Run the example:

```bash
node app.js
```

---

## 📥 Input Format

The input must be:

* Base64-encoded string of pixel values
* Pixel values must be:

  * Comma-separated
  * In **RGB format**
  * Example:

```text
"255,0,0, 0,255,0, 0,0,255, 255,255,0"
```

This represents:

* Red
* Green
* Blue
* Yellow

---

## 📐 Image Requirements

You must provide:

* `width`
* `height`

Constraint:

```
pixels.length === width × height × 3
```

---

## 🧠 How It Works

Pipeline:

```
Base64
  ↓
Decode
  ↓
String → Pixel Array
  ↓
RGB → RGBA
  ↓
Encode → PNG + BMP
  ↓
(Optional) Save to disk
  ↓
Return Base64 output
```

---

## 🧪 Example

```javascript
const width = 2;
const height = 2;

const pixelString = "255,0,0, 0,255,0, 0,0,255, 255,255,0";
const base64 = Buffer.from(pixelString).toString("base64");

const result = await generate({
  base64,
  width,
  height
});

console.log(result.png);
console.log(result.bmp);
```

---

## 📤 Output

* `output.png`
* `output.bmp`
* Base64 strings printed to console

---

## ⚙️ API

### `generate(options)`

#### Parameters:

| Name       | Type   | Description                           |
| ---------- | ------ | ------------------------------------- |
| base64     | string | Base64-encoded pixel string           |
| width      | number | Image width                           |
| height     | number | Image height                          |
| writeFiles | bool   | (optional) save files (default: true) |

#### Returns:

```js
{
  png: string,  // Base64
  bmp: string,  // Base64
  buffers: {
    png: Buffer,
    bmp: Buffer
  }
}
```

---

## 📁 Project Structure

```
.
├── app.js
├── output.png
├── output.bmp
├── package.json
└── README.md
```

---

## ⚡ Performance Notes

* Time complexity: **O(n)**
* Memory: linear to pixel count
* BMP encoding is faster than PNG
* Avoid `.split(",")` for very large inputs (use streaming)

---

## 🔧 Future Improvements

* Streaming parser for large pixel data
* Binary input format (faster than Base64)
* Web API (Express / Fastify)
* WebAssembly-based encoders
* Support for JPEG / WebP

---

## 📜 License

GPL-3.0 License

Copyright (c) 2026
**Seyyed Ali Mohammadiyeh (Max Base)**

---

## ⭐ Contributing

Pull requests are welcome. For major changes, please open an issue first.

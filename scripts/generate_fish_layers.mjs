import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, "public", "assets", "fish-source.png");
const outputDir = path.join(projectRoot, "public", "assets");

const fallbackSize = { width: 124, height: 64 };

await fs.mkdir(outputDir, { recursive: true });

const source = sharp(sourcePath).ensureAlpha();
const metadata = await source.metadata();
if (!metadata.width || !metadata.height) {
  throw new Error("Could not read fish source dimensions.");
}

const { data, info } = await source.raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;

let minX = width;
let minY = height;
let maxX = 0;
let maxY = 0;

for (let i = 0; i < data.length; i += 4) {
  const red = data[i];
  const green = data[i + 1];
  const blue = data[i + 2];
  const alpha = data[i + 3];
  const x = (i / 4) % width;
  const y = Math.floor(i / 4 / width);
  const maxChannel = Math.max(red, green, blue);

  if (alpha === 0) {
    continue;
  }

  if (maxChannel < 58) {
    data[i + 3] = 0;
    continue;
  }

  if (maxChannel < 108 && green > red * 1.04 && green > blue * 1.02) {
    data[i + 3] = Math.max(0, (maxChannel - 58) * 5);
  }

  if (data[i + 3] > 16) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
}

if (minX >= maxX || minY >= maxY) {
  throw new Error("Could not isolate fish from source image.");
}

const padding = 24;
const trimX = Math.max(0, minX - padding);
const trimY = Math.max(0, minY - padding);
const trimWidth = Math.min(width - trimX, maxX - minX + padding * 2);
const trimHeight = Math.min(height - trimY, maxY - minY + padding * 2);

const trimmed = await sharp(Buffer.from(data), { raw: { width, height, channels: 4 } })
  .extract({ left: trimX, top: trimY, width: trimWidth, height: trimHeight })
  .raw()
  .toBuffer();

const layers = [
  {
    name: "fish-body.png",
    alphaMask: (xRatio, yRatio) => {
      const tailMask = smoothStep(0.14, 0.36, xRatio);
      const dorsalCut = 1 - zoneMask(xRatio, yRatio, 0.25, 0.78, 0.0, 0.38, 0.09);
      const bellyCut = 1 - zoneMask(xRatio, yRatio, 0.33, 0.87, 0.56, 0.98, 0.1);
      const faceProtect = zoneMask(xRatio, yRatio, 0.62, 1.0, 0.12, 0.88, 0.08);
      return Math.max(faceProtect, tailMask * dorsalCut * bellyCut);
    },
  },
  {
    name: "fish-tail.png",
    alphaMask: (xRatio, yRatio) => {
      const tailBody = 1 - smoothStep(0.28, 0.46, xRatio);
      const tailHeight = edgeFade(yRatio, 0.05, 0.92, 0.14);
      return tailBody * tailHeight;
    },
  },
  {
    name: "fish-dorsal.png",
    alphaMask: (xRatio, yRatio) => zoneMask(xRatio, yRatio, 0.24, 0.78, 0.0, 0.4, 0.1),
  },
  {
    name: "fish-belly.png",
    alphaMask: (xRatio, yRatio) => {
      const mainFin = zoneMask(xRatio, yRatio, 0.33, 0.87, 0.56, 0.98, 0.08);
      const rearFin = zoneMask(xRatio, yRatio, 0.2, 0.5, 0.5, 0.86, 0.08);
      return Math.max(mainFin, rearFin);
    },
  },
];

for (const layer of layers) {
  const output = Buffer.from(trimmed);
  for (let i = 0; i < output.length; i += 4) {
    const alpha = output[i + 3];
    if (alpha === 0) {
      continue;
    }

    const pixelIndex = i / 4;
    const xRatio = (pixelIndex % trimWidth) / trimWidth;
    const yRatio = Math.floor(pixelIndex / trimWidth) / trimHeight;
    const alphaFactor = clamp(layer.alphaMask(xRatio, yRatio), 0, 1);
    output[i + 3] = alphaFactor <= 0.01 ? 0 : Math.round(alpha * alphaFactor);
  }

  await sharp(output, {
    raw: { width: trimWidth, height: trimHeight, channels: 4 },
  }).png().toFile(path.join(outputDir, layer.name));
}

await sharp(trimmed, {
  raw: { width: trimWidth, height: trimHeight, channels: 4 },
}).png().toFile(path.join(outputDir, "fish-clean.png"));

await fs.writeFile(
  path.join(outputDir, "fish-rig.json"),
  JSON.stringify({
    width: trimWidth || fallbackSize.width,
    height: trimHeight || fallbackSize.height,
    layers: layers.map((layer) => layer.name),
  }, null, 2),
  "utf8",
);

function smoothStep(edge0, edge1, value) {
  const scaled = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return scaled * scaled * (3 - 2 * scaled);
}

function edgeFade(value, min, max, feather) {
  const left = smoothStep(min, min + feather, value);
  const right = 1 - smoothStep(max - feather, max, value);
  return left * right;
}

function zoneMask(xRatio, yRatio, xStart, xEnd, yStart, yEnd, feather) {
  return edgeFade(xRatio, xStart, xEnd, feather) * edgeFade(yRatio, yStart, yEnd, feather);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const brandRoot = path.join(projectRoot, "public", "brand");
const exportRoot = path.join(brandRoot, "exports");
const CONTENT_RATIO = 0.9;

const assets = [
  {
    input: path.join(brandRoot, "youmine-wordmark-gradient.svg"),
    output: path.join(exportRoot, "youmine-wordmark-gradient-4000w.png"),
    width: 4000,
  },
  {
    input: path.join(brandRoot, "youmine-wordmark-black.svg"),
    output: path.join(exportRoot, "youmine-wordmark-black-4000w.png"),
    width: 4000,
  },
  {
    input: path.join(brandRoot, "youmine-wordmark-white.svg"),
    output: path.join(exportRoot, "youmine-wordmark-white-4000w.png"),
    width: 4000,
  },
  {
    input: path.join(brandRoot, "youmine-wordmark-elevated-gradient.svg"),
    output: path.join(exportRoot, "youmine-wordmark-elevated-gradient-4200w.png"),
    width: 4200,
  },
  {
    input: path.join(brandRoot, "youmine-wordmark-elevated-black.svg"),
    output: path.join(exportRoot, "youmine-wordmark-elevated-black-4200w.png"),
    width: 4200,
  },
  {
    input: path.join(brandRoot, "youmine-wordmark-elevated-white.svg"),
    output: path.join(exportRoot, "youmine-wordmark-elevated-white-4200w.png"),
    width: 4200,
  },
  {
    input: path.join(brandRoot, "youmine-stacked-gradient.svg"),
    output: path.join(exportRoot, "youmine-stacked-gradient-2800w.png"),
    width: 2800,
  },
  {
    input: path.join(brandRoot, "youmine-stacked-black.svg"),
    output: path.join(exportRoot, "youmine-stacked-black-2800w.png"),
    width: 2800,
  },
  {
    input: path.join(brandRoot, "youmine-stacked-white.svg"),
    output: path.join(exportRoot, "youmine-stacked-white-2800w.png"),
    width: 2800,
  },
  {
    input: path.join(brandRoot, "youmine-wordmark-print-black.svg"),
    output: path.join(exportRoot, "youmine-wordmark-print-black-4800w.png"),
    width: 4800,
  },
  {
    input: path.join(brandRoot, "youmine-wordmark-print-white.svg"),
    output: path.join(exportRoot, "youmine-wordmark-print-white-4800w.png"),
    width: 4800,
  },
];

async function findVisibleBounds(imageBuffer) {
  const { data, info } = await sharp(imageBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha <= 8) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) {
    throw new Error("Brand asset does not contain any visible pixels.");
  }

  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

for (const asset of assets) {
  const rendered = await sharp(asset.input)
    .resize({ width: asset.width })
    .png()
    .toBuffer();
  const bounds = await findVisibleBounds(rendered);
  const contentWidth = Math.round(asset.width * CONTENT_RATIO);
  const content = await sharp(rendered)
    .extract(bounds)
    .resize({ width: contentWidth })
    .png()
    .toBuffer();
  const { height: contentHeight } = await sharp(content).metadata();
  const canvasHeight = Math.ceil(contentHeight / CONTENT_RATIO);

  await sharp({
    create: {
      width: asset.width,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: content,
        left: Math.round((asset.width - contentWidth) / 2),
        top: Math.round((canvasHeight - contentHeight) / 2),
      },
    ])
    .png()
    .toFile(asset.output);
}

console.log("Exported merch-ready PNG wordmarks to public/brand/exports");
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const brandRoot = path.join(projectRoot, "public", "brand");
const exportRoot = path.join(brandRoot, "exports");

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

for (const asset of assets) {
  await sharp(asset.input)
    .resize({ width: asset.width })
    .png()
    .toFile(asset.output);
}

console.log("Exported merch-ready PNG wordmarks to public/brand/exports");
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const sourceIcon = path.join(projectRoot, "public", "mobile", "app-icon-source.svg");
const androidResRoot = path.join(projectRoot, "android", "app", "src", "main", "res");

const densities = [
  { dir: "mipmap-mdpi", icon: 48, foreground: 108 },
  { dir: "mipmap-hdpi", icon: 72, foreground: 162 },
  { dir: "mipmap-xhdpi", icon: 96, foreground: 216 },
  { dir: "mipmap-xxhdpi", icon: 144, foreground: 324 },
  { dir: "mipmap-xxxhdpi", icon: 192, foreground: 432 },
];

function circleMaskSvg(size) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );
}

async function renderSquare(size, outputPath) {
  await sharp(sourceIcon)
    .resize(size, size)
    .png()
    .toFile(outputPath);
}

async function renderRound(size, outputPath) {
  const base = await sharp(sourceIcon)
    .resize(size, size)
    .png()
    .toBuffer();

  await sharp(base)
    .composite([{ input: circleMaskSvg(size), blend: "dest-in" }])
    .png()
    .toFile(outputPath);
}

async function renderForeground(size, outputPath) {
  const insetSize = Math.round(size * 0.82);
  const offset = Math.round((size - insetSize) / 2);
  const iconBuffer = await sharp(sourceIcon)
    .resize(insetSize, insetSize)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: iconBuffer, left: offset, top: offset }])
    .png()
    .toFile(outputPath);
}

for (const density of densities) {
  const outDir = path.join(androidResRoot, density.dir);
  await mkdir(outDir, { recursive: true });

  await renderSquare(density.icon, path.join(outDir, "ic_launcher.png"));
  await renderRound(density.icon, path.join(outDir, "ic_launcher_round.png"));
  await renderForeground(density.foreground, path.join(outDir, "ic_launcher_foreground.png"));
}

console.log("Android launcher icons exported from public/mobile/app-icon-source.svg");
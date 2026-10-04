import crypto from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

const IMAGE_SIGNATURES = [
  { ext: ".jpg", mime: "image/jpeg", match: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: ".png", mime: "image/png", match: (b) => b.length >= 8 && b.slice(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])) },
  { ext: ".gif", mime: "image/gif", match: (b) => b.length >= 6 && ["GIF87a", "GIF89a"].includes(b.slice(0, 6).toString("ascii")) },
  { ext: ".webp", mime: "image/webp", match: (b) => b.length >= 12 && b.slice(0, 4).toString("ascii") === "RIFF" && b.slice(8, 12).toString("ascii") === "WEBP" },
];

const saveUploadedImage = async (file, { folder = "images", maxBytes = 5 * 1024 * 1024 } = {}) => {
  if (!file || typeof file.arrayBuffer !== "function") throw new Error("Image file is required");
  if (!file.size || file.size > maxBytes) throw new Error("Image file is too large");
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = IMAGE_SIGNATURES.find((signature) => signature.match(buffer));
  if (!detected) throw new Error("Unsupported image content");

  const safeFolder = String(folder).replace(/[^a-z0-9_-]/gi, "");
  const relativeDir = path.join("uploads", safeFolder);
  const uploadDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(uploadDir, { recursive: true });
  const filename = `${crypto.randomUUID()}${detected.ext}`;
  await writeFile(path.join(uploadDir, filename), buffer, { flag: "wx" });
  return `/${relativeDir.replaceAll(path.sep, "/")}/${filename}`;
};

const removeLocalUpload = async (url) => {
  if (!url || !String(url).startsWith("/uploads/")) return;
  const resolved = path.resolve(process.cwd(), "public", `.${url}`);
  const allowedRoot = path.resolve(process.cwd(), "public", "uploads");
  if (!resolved.startsWith(allowedRoot)) return;
  await unlink(resolved).catch(() => {});
};

export { saveUploadedImage, removeLocalUpload };

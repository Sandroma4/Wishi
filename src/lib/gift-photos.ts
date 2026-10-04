import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const photoName = /^[a-f0-9-]{36}\.webp$/;
// Runtime uploads live on a persistent volume and must not be bundled into the build.
const directory = () =>
  path.resolve(
    /* turbopackIgnore: true */ process.env.UPLOAD_DIR || "uploads/gifts",
  );
export async function saveGiftPhoto(file: File) {
  if (file.size > 5 * 1024 * 1024) throw new Error("invalidPhoto");
  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    const source = sharp(bytes, { limitInputPixels: 25_000_000 });
    const metadata = await source.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format || ""))
      throw new Error();
    const output = await source
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    const filename = randomUUID() + ".webp";
    await mkdir(directory(), { recursive: true });
    await writeFile(path.join(directory(), filename), output, { flag: "wx" });
    return filename;
  } catch {
    throw new Error("invalidPhoto");
  }
}
export async function removeGiftPhoto(filename: string | null) {
  if (!filename || !photoName.test(filename)) return;
  try {
    await unlink(
      /* turbopackIgnore: true */ path.join(
        /* turbopackIgnore: true */ directory(),
        filename,
      ),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT")
      console.error("Gift photo cleanup failed");
  }
}
export async function readGiftPhoto(filename: string) {
  if (!photoName.test(filename)) return null;
  try {
    return await readFile(
      /* turbopackIgnore: true */ path.join(
        /* turbopackIgnore: true */ directory(),
        filename,
      ),
    );
  } catch {
    return null;
  }
}
export async function copyGiftPhoto(filename: string | null) {
  if (!filename || !photoName.test(filename)) return null;
  const bytes = await readGiftPhoto(filename);
  if (!bytes) throw new Error("missingPhoto");
  const copy = randomUUID() + ".webp";
  await mkdir(directory(), { recursive: true });
  await writeFile(
    /* turbopackIgnore: true */ path.join(
      /* turbopackIgnore: true */ directory(),
      copy,
    ),
    bytes,
    { flag: "wx" },
  );
  return copy;
}

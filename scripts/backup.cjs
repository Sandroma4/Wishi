const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash, randomUUID } = require("node:crypto");
const { DatabaseSync, backup } = require("node:sqlite");
const photoPattern = /^[a-f0-9-]{36}\.webp$/;
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function regularFile(file) {
  const stat = await fs.lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink())
    throw new Error("Fichier ordinaire requis : " + path.basename(file));
  return fs.readFile(file);
}
function inspect(database) {
  const db = new DatabaseSync(database, { readOnly: true });
  try {
    if (
      db
        .prepare("PRAGMA integrity_check")
        .all()
        .some((row) => Object.values(row)[0] !== "ok") ||
      db.prepare("PRAGMA foreign_key_check").all().length
    )
      throw new Error("La base SQLite est incohérente.");
    return [
      ...new Set(
        db
          .prepare("SELECT image FROM WishlistItem WHERE image IS NOT NULL")
          .all()
          .map((row) => row.image)
          .filter((image) => photoPattern.test(image)),
      ),
    ].sort();
  } finally {
    db.close();
  }
}
async function makeBackup({ database, photos, destination }) {
  await fs.mkdir(destination, { recursive: false, mode: 0o700 });
  await fs.mkdir(path.join(destination, "photos"), { mode: 0o700 });
  const db = new DatabaseSync(database, { readOnly: true });
  try {
    await backup(db, path.join(destination, "database.db"));
  } finally {
    db.close();
  }
  const names = inspect(path.join(destination, "database.db"));
  const entries = [];
  const snapshot = await regularFile(path.join(destination, "database.db"));
  entries.push({
    file: "database.db",
    size: snapshot.length,
    sha256: digest(snapshot),
  });
  for (const name of names) {
    // Upload names are immutable. Missing files fail the backup instead of claiming success.
    const bytes = await regularFile(path.join(photos, name));
    await fs.writeFile(path.join(destination, "photos", name), bytes, {
      flag: "wx",
      mode: 0o600,
    });
    entries.push({
      file: "photos/" + name,
      size: bytes.length,
      sha256: digest(bytes),
    });
  }
  await fs.chmod(path.join(destination, "database.db"), 0o600);
  await fs.writeFile(
    path.join(destination, "manifest.json"),
    JSON.stringify(
      { version: 1, createdAt: new Date().toISOString(), entries },
      null,
      2,
    ) + "\n",
    { flag: "wx", mode: 0o600 },
  );
  return verifyBackup(destination);
}
async function verifyBackup(directory) {
  const manifest = JSON.parse(
    await regularFile(path.join(directory, "manifest.json")),
  );
  if (
    manifest.version !== 1 ||
    !Array.isArray(manifest.entries) ||
    !manifest.entries.length
  )
    throw new Error("Manifest invalide.");
  const seen = new Set();
  const photosDirectory = await fs.lstat(path.join(directory, "photos"));
  if (!photosDirectory.isDirectory() || photosDirectory.isSymbolicLink())
    throw new Error("Dossier photos invalide.");
  for (const entry of manifest.entries) {
    if (
      typeof entry.file !== "string" ||
      !(
        entry.file === "database.db" ||
        /^photos\/[a-f0-9-]{36}\.webp$/.test(entry.file)
      ) ||
      seen.has(entry.file) ||
      !Number.isSafeInteger(entry.size) ||
      entry.size < 0 ||
      !/^[a-f0-9]{64}$/.test(entry.sha256 || "")
    )
      throw new Error("Entrée de manifest invalide.");
    seen.add(entry.file);
    const bytes = await regularFile(
      path.join(directory, ...entry.file.split("/")),
    );
    if (bytes.length !== entry.size || digest(bytes) !== entry.sha256)
      throw new Error("Fichier modifié ou incomplet : " + entry.file);
  }
  if (!seen.has("database.db")) throw new Error("Base absente du manifest.");
  const names = inspect(path.join(directory, "database.db"));
  if (
    seen.size !== names.length + 1 ||
    names.some((name) => !seen.has("photos/" + name))
  )
    throw new Error("Les photos ne correspondent pas à la base.");
  return { photos: names.length, files: seen.size };
}
async function restoreBackup(source, destination) {
  await verifyBackup(source);
  // Exclusive creation deliberately refuses any existing target, including an empty folder.
  await fs.mkdir(destination, { recursive: false, mode: 0o700 });
  await fs.mkdir(path.join(destination, "photos"), { mode: 0o700 });
  const manifest = JSON.parse(
    await regularFile(path.join(source, "manifest.json")),
  );
  for (const entry of [...manifest.entries, { file: "manifest.json" }]) {
    const bytes = await regularFile(
      path.join(source, ...entry.file.split("/")),
    );
    await fs.writeFile(
      path.join(destination, ...entry.file.split("/")),
      bytes,
      { flag: "wx", mode: 0o600 },
    );
  }
  return verifyBackup(destination);
}
function backupConfiguration() {
  const url = process.env.DATABASE_URL || "file:./dev.db";
  if (!url.startsWith("file:") || url.includes("?"))
    throw new Error("Utiliser une URL SQLite file: sans paramètres.");
  return {
    database: path.resolve(__dirname, "../prisma", url.slice(5)),
    photos: path.resolve(
      __dirname,
      "..",
      process.env.UPLOAD_DIR || "uploads/gifts",
    ),
    root: path.resolve(__dirname, "../prisma/backups"),
  };
}
async function main() {
  const [operation, source, flag, target] = process.argv.slice(2);
  if (operation === "create") {
    const { database, photos, root } = backupConfiguration();
    await fs.mkdir(root, { recursive: true, mode: 0o700 });
    const destination = source
      ? path.resolve(source)
      : path.join(
          root,
          "backup-" +
            new Date().toISOString().replace(/[:.]/g, "-") +
            "-" +
            randomUUID().slice(0, 8),
        );
    const result = await makeBackup({ database, photos, destination });
    console.log(
      `Sauvegarde vérifiée : ${destination} (${result.photos} photos).`,
    );
  } else if (operation === "verify" && source) {
    const result = await verifyBackup(path.resolve(source));
    console.log(
      `Sauvegarde valide : ${result.files} fichiers, ${result.photos} photos.`,
    );
  } else if (
    operation === "restore" &&
    source &&
    flag === "--target" &&
    target
  ) {
    const destination = path.resolve(target);
    const result = await restoreBackup(path.resolve(source), destination);
    console.log(
      `Restauration vérifiée : ${destination} (${result.photos} photos).\nAprès arrêt du serveur, configurer DATABASE_URL=file:${path.join(destination, "database.db").replaceAll("\\", "/")} et UPLOAD_DIR=${path.join(destination, "photos")} puis appliquer les migrations et redémarrer.`,
    );
  } else
    throw new Error(
      "Usage : backup.cjs create [dossier-neuf] | verify dossier | restore dossier --target dossier-neuf",
    );
}
module.exports = {
  makeBackup,
  verifyBackup,
  restoreBackup,
  backupConfiguration,
};
if (require.main === module)
  main().catch((error) => {
    console.error("Échec : " + error.message);
    process.exitCode = 1;
  });

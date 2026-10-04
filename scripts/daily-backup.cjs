const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const {
  makeBackup,
  restoreBackup,
  backupConfiguration,
} = require("./backup.cjs");
const { copyExternalBackup } = require("./external-backup.cjs");
async function dailyBackup({
  database,
  photos,
  root,
  statusFile,
  externalRoot,
  projectRoot,
}) {
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  const name =
    "backup-" +
    new Date().toISOString().replace(/[:.]/g, "-") +
    "-" +
    randomUUID().slice(0, 8);
  const destination = path.join(root, name);
  const probe = path.join(root, ".restore-check-" + randomUUID());
  const status = { completedAt: new Date().toISOString(), backup: destination };
  try {
    const result = await makeBackup({ database, photos, destination });
    await restoreBackup(destination, probe);
    // Only the disposable restoration created by this run can be removed.
    if (
      path.dirname(path.resolve(probe)) !== path.resolve(root) ||
      !path.basename(probe).startsWith(".restore-check-")
    )
      throw new Error("Chemin de vérification inattendu.");
    await fs.rm(probe, { recursive: true, force: false });
    Object.assign(status, {
      success: true,
      photos: result.photos,
      restorationVerified: true,
      externalCopy: "notConfigured",
    });
    if (externalRoot) {
      status.externalCopy = "pending";
      const external = await copyExternalBackup(
        destination,
        externalRoot,
        projectRoot,
      );
      Object.assign(status, {
        externalCopy: "verified",
        externalBackup: external.destination,
      });
    }
  } catch (error) {
    if (status.externalCopy === "pending") status.externalCopy = "failed";
    Object.assign(status, { success: false, error: error.message });
  }
  await fs.mkdir(path.dirname(statusFile), { recursive: true, mode: 0o700 });
  await fs.writeFile(statusFile, JSON.stringify(status, null, 2) + "\n", {
    mode: 0o600,
  });
  if (!status.success) throw new Error(status.error);
  return status;
}
module.exports = { dailyBackup };
if (require.main === module)
  dailyBackup({
    ...backupConfiguration(),
    statusFile: path.resolve(
      process.env.BACKUP_STATUS_FILE ||
        path.resolve(__dirname, "../.local/backup-status.json"),
    ),
    externalRoot: process.env.BACKUP_EXTERNAL_DIR?.trim() || undefined,
  })
    .then((result) =>
      console.log(
        `Sauvegarde et restauration vérifiées : ${result.backup} (${result.photos} photos).\n${result.externalCopy === "verified" ? "Copie externe vérifiée : " + result.externalBackup : "Copie externe non configurée : renseigner BACKUP_EXTERNAL_DIR."}`,
      ),
    )
    .catch((error) => {
      console.error("Échec de sauvegarde : " + error.message);
      process.exitCode = 1;
    });

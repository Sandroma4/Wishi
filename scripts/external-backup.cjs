const fs = require("node:fs/promises");
const path = require("node:path");
const { restoreBackup } = require("./backup.cjs");
async function copyExternalBackup(
  source,
  externalRoot,
  projectRoot = path.resolve(__dirname, ".."),
) {
  if (!path.isAbsolute(externalRoot))
    throw new Error(
      "BACKUP_EXTERNAL_DIR doit être un chemin absolu vers un dossier existant.",
    );
  const targetRoot = await fs.realpath(externalRoot);
  if (!(await fs.stat(targetRoot)).isDirectory())
    throw new Error("La destination externe doit être un dossier.");
  const project = await fs.realpath(projectRoot);
  const relative = path.relative(project, targetRoot);
  if (
    !relative ||
    (!relative.startsWith(".." + path.sep) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  )
    throw new Error(
      "La copie externe doit être conservée hors du dossier du projet.",
    );
  const name = path.basename(source);
  if (!/^backup-[a-zA-Z0-9-]+$/.test(name))
    throw new Error("Nom de sauvegarde inattendu.");
  const destination = path.join(targetRoot, name);
  // Exclusive target creation and verification are shared with the restoration utility.
  const result = await restoreBackup(source, destination);
  return { destination, ...result };
}
module.exports = { copyExternalBackup };

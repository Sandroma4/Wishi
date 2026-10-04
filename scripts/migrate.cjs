const fs = require("node:fs"),
  path = require("node:path"),
  { spawnSync } = require("node:child_process"),
  { DatabaseSync } = require("node:sqlite");
const { backupConfiguration } = require("./backup.cjs"),
  { dailyBackup } = require("./daily-backup.cjs");
async function main() {
  const mount = process.env.RAILWAY_VOLUME_MOUNT_PATH;
  if (mount) {
    const config = backupConfiguration();
    if (fs.existsSync(config.database)) {
      const sql = new DatabaseSync(config.database, { readOnly: true });
      let applied;
      try {
        applied = new Set(
          sql
            .prepare(
              "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL",
            )
            .all()
            .map((row) => row.migration_name),
        );
      } finally {
        sql.close();
      }
      const migrations = fs
        .readdirSync(path.join(__dirname, "../prisma/migrations"))
        .filter((name) => /^\d/.test(name));
      if (migrations.some((name) => !applied.has(name))) {
        await dailyBackup({
          ...config,
          root: process.env.BACKUP_ROOT || path.join(mount, "backups"),
          statusFile: path.join(mount, "pre-migration-backup-status.json"),
        });
        console.log("Wishi pre-migration backup and restoration verified");
      }
    }
  }
  const result = spawnSync(
    process.execPath,
    [require.resolve("prisma/build/index.js"), "migrate", "deploy"],
    { stdio: "inherit", env: process.env },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
main().catch(() => {
  console.error(
    "Wishi migration stopped; check backup and database status before retrying",
  );
  process.exitCode = 1;
});

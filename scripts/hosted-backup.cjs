const fs = require("node:fs/promises");
const path = require("node:path");
const { dailyBackup } = require("./daily-backup.cjs");
const { backupConfiguration } = require("./backup.cjs");
function localTime(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type).value;
  return {
    day: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
  };
}
function backupDue(now, status) {
  if (!status?.success || !status.restorationVerified) return true;
  const completed = new Date(status.completedAt);
  if (!Number.isFinite(completed.getTime())) return true;
  const current = localTime(now),
    previous = localTime(completed);
  return (
    current.hour >= 20 &&
    (previous.day < current.day ||
      (previous.day === current.day && previous.hour < 20))
  );
}
module.exports = { backupDue };
if (require.main === module) {
  let running = false,
    retryAfter = 0;
  const statusFile = path.resolve(process.env.BACKUP_STATUS_FILE);
  async function tick() {
    if (running || Date.now() < retryAfter) return;
    running = true;
    try {
      let status;
      try {
        status = JSON.parse(await fs.readFile(statusFile, "utf8"));
      } catch {}
      if (!backupDue(new Date(), status)) return;
      const config = backupConfiguration();
      await fs.mkdir(config.root, { recursive: true, mode: 0o700 });
      const disk = await fs.statfs(config.root);
      if (disk.bavail * disk.bsize < 32 * 1024 * 1024)
        throw new Error("backupStorageLow");
      await dailyBackup({ ...config, statusFile });
      console.log("Wishi hosted backup and restoration verified");
    } catch {
      retryAfter = Date.now() + 15 * 60 * 1000;
      console.error(
        "Wishi hosted backup failed; check private backup status and volume capacity",
      );
    } finally {
      running = false;
    }
  }
  tick();
  setInterval(tick, 60 * 1000);
}

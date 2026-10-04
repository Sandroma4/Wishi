const { spawn, fork } = require("node:child_process");
const path = require("node:path");
const mount = process.env.RAILWAY_VOLUME_MOUNT_PATH;
let worker;
if (mount && process.env.WISHI_AUTO_BACKUP !== "off") {
  process.env.BACKUP_ROOT ||= path.join(mount, "backups");
  process.env.BACKUP_STATUS_FILE ||= path.join(mount, "backup-status.json");
  process.env.EMAIL_STATUS_DIR ||= path.join(mount, "email-status");
  worker = fork(path.join(__dirname, "hosted-backup.cjs"), [], {
    stdio: "inherit",
  });
  worker.on("exit", (code) => {
    if (code !== 0) console.error("Wishi backup worker stopped unexpectedly");
  });
}
const server = spawn(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "start"],
  { stdio: "inherit", env: process.env },
);
let stopping = false;
function stop(signal) {
  if (stopping) return;
  stopping = true;
  worker?.kill(signal);
  server.kill(signal);
}
process.on("SIGTERM", () => stop("SIGTERM"));
process.on("SIGINT", () => stop("SIGINT"));
server.on("error", () => {
  worker?.kill();
  process.exitCode = 1;
});
server.on("exit", (code) => {
  worker?.kill();
  process.exitCode = code ?? 1;
});

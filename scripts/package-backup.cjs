const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
if (process.platform !== "win32")
  throw new Error("Cet outil de compression utilise Windows.");
const script = fs.readFileSync(
  path.join(__dirname, "package-backup.ps1"),
  "utf8",
);
const result = spawnSync(
  "powershell.exe",
  [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    "& { " + script + " } $env:WISHI_BACKUP_PACKAGE_SOURCE",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      WISHI_BACKUP_SCRIPT_DIRECTORY: __dirname,
      WISHI_BACKUP_PACKAGE_SOURCE: process.argv[2] || "",
    },
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;

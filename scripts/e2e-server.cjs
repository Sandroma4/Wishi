const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

// Never reuse the developer's database, uploads, credentials or mail service.
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cadeoly-e2e-"));
new DatabaseSync(path.join(directory, "test.db")).close();
const env = {
  ...process.env,
  DATABASE_URL: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}`,
  AUTH_SECRET: randomBytes(32).toString("hex"),
  AUTH_URL: "http://127.0.0.1:3107",
  AUTH_TRUST_HOST: "true",
  AUTH_GOOGLE_ID: "e2e-only-client",
  AUTH_GOOGLE_SECRET: "e2e-only-secret",
  UPLOAD_DIR: path.join(directory, "uploads"),
  MAIL_TRANSPORT: "file",
  EMAIL_OUTBOX_DIR: path.join(directory, "mail"),
  RESEND_API_KEY: "",
  RAILWAY_VOLUME_MOUNT_PATH: "",
  CADEOLY_E2E: "true",
};
const cleanup = () => fs.rmSync(directory, { recursive: true, force: true });
for (const args of [
  [require.resolve("prisma/build/index.js"), "migrate", "deploy"],
  [require.resolve("next/dist/bin/next"), "build"],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.status !== 0) {
    cleanup();
    process.exit(result.status || 1);
  }
}
// Run the CLI in this process so Playwright can stop it on Windows as well.
Object.assign(process.env, env);
process.on("exit", cleanup);
process.argv = [
  process.execPath,
  require.resolve("next/dist/bin/next"),
  "start",
  "--hostname",
  "127.0.0.1",
  "--port",
  "3107",
];
require("next/dist/bin/next");

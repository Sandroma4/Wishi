const { test } = require("node:test");
const assert = require("node:assert/strict");
const { backupDue } = require("../scripts/hosted-backup.cjs");
const verified = (completedAt) => ({
  success: true,
  restorationVerified: true,
  completedAt,
});
test("hosted schedule catches up once after Brussels 20h and does not duplicate on restart", () => {
  const now = new Date("2026-10-04T18:05:00Z");
  assert.equal(backupDue(now, verified("2026-10-04T10:00:00Z")), true);
  assert.equal(backupDue(now, verified("2026-10-04T18:01:00Z")), false);
  assert.equal(
    backupDue(
      new Date("2026-10-05T10:00:00Z"),
      verified("2026-10-04T18:01:00Z"),
    ),
    false,
  );
  assert.equal(
    backupDue(
      new Date("2026-10-05T18:00:00Z"),
      verified("2026-10-04T18:01:00Z"),
    ),
    true,
  );
});
test("hosted backups initialize, retry failures and follow winter time", () => {
  assert.equal(backupDue(new Date(), null), true);
  assert.equal(backupDue(new Date(), { success: false }), true);
  assert.equal(backupDue(new Date(), verified("invalid")), true);
  assert.equal(
    backupDue(
      new Date("2026-12-04T18:30:00Z"),
      verified("2026-12-03T19:01:00Z"),
    ),
    false,
  );
  assert.equal(
    backupDue(
      new Date("2026-12-04T19:00:00Z"),
      verified("2026-12-03T19:01:00Z"),
    ),
    true,
  );
});

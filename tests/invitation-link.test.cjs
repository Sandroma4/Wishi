require("ts-node").register({
  transpileOnly: true,
  compilerOptions: { module: "CommonJS", moduleResolution: "node" },
});
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { invitationPath } = require("../src/lib/invitation-link.ts");
test("invitation links accept local routes and codes without navigating to foreign sites", () => {
  const token = "a".repeat(64);
  assert.equal(invitationPath(token), `/invite/${token}`);
  assert.equal(
    invitationPath(`https://cadeoly.example/fr/invite/${token}`),
    `/invite/${token}`,
  );
  assert.equal(invitationPath(`/en/invite/${token}`), `/invite/${token}`);
  for (const input of [
    "javascript:alert(1)",
    "https://evil.test/login",
    "invalid",
    `/fr/invite/${token}/other`,
  ])
    assert.equal(invitationPath(input), null);
});

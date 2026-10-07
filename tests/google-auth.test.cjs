require("ts-node").register({
  transpileOnly: true,
  compilerOptions: { module: "CommonJS", moduleResolution: "node" },
});
const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  googleAuthEnabled,
  googleProfileAllowed,
} = require("../src/lib/google-auth.ts");
test("Google needs both private credentials and a verified email", () => {
  assert.equal(googleAuthEnabled({}), false);
  assert.equal(googleAuthEnabled({ AUTH_GOOGLE_ID: "id" }), false);
  assert.equal(
    googleAuthEnabled({ AUTH_GOOGLE_ID: "id", AUTH_GOOGLE_SECRET: "secret" }),
    true,
  );
  assert.equal(
    googleProfileAllowed({ email: "owner@example.test", email_verified: true }),
    true,
  );
  for (const profile of [
    undefined,
    {},
    { email: "owner@example.test", email_verified: false },
    { email: "owner@example.test", email_verified: "true" },
  ])
    assert.equal(googleProfileAllowed(profile), false);
});

const { canonicalAuthRequest } = require("../src/lib/auth-request.ts");
test("canonical OAuth origin preserves CSRF POST body and cookies", async () => {
  const request = new Request(
    "http://localhost:3000/api/auth/signin/google?test=1",
    {
      method: "POST",
      headers: {
        cookie: "authjs.csrf-token=test",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "csrfToken=test",
    },
  );
  const canonical = canonicalAuthRequest(request, "http://127.0.0.1:3000");
  assert.equal(
    canonical.url,
    "http://127.0.0.1:3000/api/auth/signin/google?test=1",
  );
  assert.equal(canonical.headers.get("cookie"), "authjs.csrf-token=test");
  assert.equal(await canonical.text(), "csrfToken=test");
});

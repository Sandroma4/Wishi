require("ts-node").register({
  transpileOnly: true,
  compilerOptions: { module: "CommonJS", moduleResolution: "node" },
});
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { PrismaClient } = require("@wishi/prisma-client");
const { createAuthConfig } = require("../src/lib/auth-config.ts");
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cadeoly-google-"));
const file = path.join(directory, "test.db");
const sql = new DatabaseSync(file);
for (const migration of fs
  .readdirSync(path.join(__dirname, "../prisma/migrations"))
  .filter((v) => /^\d/.test(v))
  .sort())
  sql.exec(
    fs.readFileSync(
      path.join(__dirname, "../prisma/migrations", migration, "migration.sql"),
      "utf8",
    ),
  );
sql.close();
const db = new PrismaClient({ datasources: { db: { url: `file:${file}` } } });
let Auth, customFetch, SignJWT, privateKey, jwk, encode;
before(async () => {
  ({ Auth, customFetch } = await import("@auth/core"));
  ({ encode } = await import("@auth/core/jwt"));
  const jose = await import("jose");
  SignJWT = jose.SignJWT;
  const keys = await jose.generateKeyPair("RS256");
  privateKey = keys.privateKey;
  jwk = {
    ...(await jose.exportJWK(keys.publicKey)),
    kid: "test-key",
    alg: "RS256",
    use: "sig",
  };
});
after(async () => {
  await db.$disconnect();
  fs.rmSync(directory, { recursive: true, force: true });
});
const secret = "test-google-auth-secret-with-enough-length";
function makeConfig(profile) {
  const config = createAuthConfig(db, {
    AUTH_SECRET: secret,
    AUTH_GOOGLE_ID: "test-client",
    AUTH_GOOGLE_SECRET: "test-secret",
  });
  config.trustHost = true;
  config.basePath = "/api/auth";
  config.logger = { error() {}, warn() {}, debug() {} };
  const mockFetch = async (input) => {
    const url = String(input instanceof Request ? input.url : input);
    let data;
    if (url.includes(".well-known"))
      data = {
        issuer: "https://accounts.google.com",
        authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        token_endpoint: "https://oauth2.googleapis.com/token",
        jwks_uri: "https://www.googleapis.com/oauth2/v3/certs",
        userinfo_endpoint: "https://openidconnect.googleapis.com/v1/userinfo",
        response_types_supported: ["code"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
        code_challenge_methods_supported: ["S256"],
      };
    else if (url.includes("/userinfo")) data = profile;
    else if (url.includes("/certs")) data = { keys: [jwk] };
    else if (url.includes("/token"))
      data = {
        access_token: "mock-token",
        token_type: "Bearer",
        expires_in: 3600,
        id_token: await new SignJWT(profile)
          .setProtectedHeader({ alg: "RS256", kid: "test-key" })
          .setIssuer("https://accounts.google.com")
          .setAudience("test-client")
          .setIssuedAt()
          .setExpirationTime("5m")
          .sign(privateKey),
      };
    else throw new Error("Unexpected OAuth network request");
    return Response.json(data);
  };
  config.providers[0].options[customFetch] = mockFetch;
  return config;
}
async function googleLogin(profile, sessionCookie = "") {
  const config = makeConfig(profile),
    cookies = new Map();
  if (sessionCookie) cookies.set("authjs.session-token", sessionCookie);
  async function send(route, options = {}) {
    const response = await Auth(
      new Request(`http://localhost:3000/api/auth/${route}`, {
        ...options,
        headers: {
          ...options.headers,
          cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
        },
      }),
      config,
    );
    for (const c of response.headers.getSetCookie()) {
      const [name, ...value] = c.split(";")[0].split("=");
      cookies.set(name, value.join("="));
    }
    return response;
  }
  const csrf = await (await send("csrf")).json();
  const start = await send("signin/google", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      callbackUrl: "http://localhost:3000/en/dashboard",
    }),
  });
  const authUrl = new URL(start.headers.get("location"));
  assert.equal(authUrl.hostname, "accounts.google.com");
  assert.equal(authUrl.searchParams.get("scope"), "openid email profile");
  assert.ok(authUrl.searchParams.get("code_challenge"));
  const query = new URLSearchParams({ code: "mock-code" });
  if (authUrl.searchParams.has("state"))
    query.set("state", authUrl.searchParams.get("state"));
  const result = await send(`callback/google?${query}`);
  return {
    result,
    session: await (await send("session")).json(),
    cookies,
    config,
  };
}
test("signed Google OAuth creates persistent accounts, reuses them after revocation, and rejects unverified identities", async () => {
  const profile = {
    sub: "google-new",
    email: "Google@Example.test",
    email_verified: true,
    name: "Google owner",
  };
  const first = await googleLogin(profile);
  assert.equal(
    first.result.headers.get("location"),
    "http://localhost:3000/en/dashboard",
  );
  assert.ok(first.session.user?.id);
  const user = await db.user.findUnique({
    where: { email: "google@example.test" },
    include: { accounts: true },
  });
  assert.equal(user.id, first.session.user.id);
  assert.equal(user.password, null);
  assert.equal(user.accounts.length, 1);
  await db.user.update({
    where: { id: user.id },
    data: { sessionVersion: { increment: 1 } },
  });
  assert.equal(
    await first.config.jwt.decode({
      token: first.cookies.get("authjs.session-token"),
      salt: "authjs.session-token",
      secret,
    }),
    null,
  );
  const again = await googleLogin(profile);
  assert.equal(again.session.user.id, user.id);
  assert.equal(
    await db.account.count({ where: { providerAccountId: profile.sub } }),
    1,
  );
  const denied = await googleLogin({
    ...profile,
    sub: "unverified",
    email: "unverified@example.test",
    email_verified: false,
  });
  assert.match(denied.result.headers.get("location"), /AccessDenied/);
  assert.equal(
    await db.user.count({ where: { email: "unverified@example.test" } }),
    0,
  );
});
test("email collisions require an authenticated account; revoked sessions cannot link Google", async () => {
  const user = await db.user.create({
    data: {
      email: "existing@example.test",
      name: "Existing",
      password: "unused-hash",
    },
  });
  const profile = {
    sub: "google-existing",
    email: user.email,
    email_verified: true,
    name: "Existing",
  };
  const denied = await googleLogin(profile);
  assert.equal(
    new URL(denied.result.headers.get("location")).pathname,
    "/api/auth/error",
  );
  assert.match(denied.result.headers.get("location"), /OAuthAccountNotLinked/);
  assert.equal(await db.account.count({ where: { userId: user.id } }), 0);
  const session = await encode({
    secret,
    salt: "authjs.session-token",
    token: { sub: user.id, sessionVersion: 0 },
  });
  await db.user.update({ where: { id: user.id }, data: { sessionVersion: 1 } });
  const revoked = await googleLogin(profile, session);
  assert.match(revoked.result.headers.get("location"), /OAuthAccountNotLinked/);
  assert.equal(await db.account.count({ where: { userId: user.id } }), 0);
  const current = await encode({
    secret,
    salt: "authjs.session-token",
    token: { sub: user.id, sessionVersion: 1 },
  });
  const linked = await googleLogin(profile, current);
  assert.equal(linked.session.user.id, user.id);
  assert.equal(await db.user.count({ where: { email: user.email } }), 1);
  assert.equal(await db.account.count({ where: { userId: user.id } }), 1);
});

// Rebuild with the verified local Android tools; signing credentials stay ignored.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const tools = path.join(root, ".local/android-tools");
function child(dir, expected) {
  const match = fs
    .readdirSync(dir)
    .find((name) => fs.existsSync(path.join(dir, name, expected)));
  if (!match) throw new Error(`Missing local tool in ${dir}`);
  return path.join(dir, match);
}
const java = child(path.join(tools, "java"), "bin/java.exe");
const sdk = child(path.join(tools, "build-tools"), "aapt2.exe");
const platform = child(path.join(tools, "platform"), "android.jar");
const androidJar = path.join(platform, "android.jar");
const output = path.join(root, ".local/apk");
const build = path.join(output, "build");
const keys = path.join(root, ".local/android-signing");
for (const dir of [
  build,
  path.join(build, "classes"),
  path.join(build, "dex"),
  keys,
])
  fs.mkdirSync(dir, { recursive: true });
const passwordFile = path.join(keys, "password.txt");
const keystore = path.join(keys, "cadeoly.keystore");
if (!fs.existsSync(passwordFile))
  fs.writeFileSync(passwordFile, crypto.randomBytes(32).toString("hex"), {
    flag: "wx",
  });
const env = {
  ...process.env,
  JAVA_HOME: java,
  CADEOLY_SIGNING_PASSWORD: fs.readFileSync(passwordFile, "utf8").trim(),
};
function run(binary, args) {
  execFileSync(binary, args, { cwd: root, env, stdio: "inherit" });
}
if (!fs.existsSync(keystore))
  run(path.join(java, "bin/keytool.exe"), [
    "-genkeypair",
    "-keystore",
    keystore,
    "-alias",
    "cadeoly",
    "-storepass:env",
    "CADEOLY_SIGNING_PASSWORD",
    "-keypass:env",
    "CADEOLY_SIGNING_PASSWORD",
    "-keyalg",
    "RSA",
    "-keysize",
    "3072",
    "-validity",
    "10000",
    "-dname",
    "CN=Cadeoly, OU=Mobile, O=Cadeoly",
  ]);
run(path.join(sdk, "aapt2.exe"), [
  "compile",
  "--dir",
  path.join(__dirname, "app/src/main/res"),
  "-o",
  path.join(build, "resources.zip"),
]);
run(path.join(sdk, "aapt2.exe"), [
  "link",
  "-o",
  path.join(build, "unsigned.apk"),
  "--manifest",
  path.join(__dirname, "app/src/main/AndroidManifest.xml"),
  "-I",
  androidJar,
  path.join(build, "resources.zip"),
]);
run(path.join(java, "bin/javac.exe"), [
  "-encoding",
  "UTF-8",
  "-source",
  "8",
  "-target",
  "8",
  "-classpath",
  androidJar,
  "-d",
  path.join(build, "classes"),
  path.join(
    __dirname,
    "app/src/main/java/app/cadeoly/mobile/MainActivity.java",
  ),
]);
run(path.join(java, "bin/jar.exe"), [
  "cf",
  path.join(build, "classes.jar"),
  "-C",
  path.join(build, "classes"),
  ".",
]);
run(path.join(java, "bin/java.exe"), [
  "-cp",
  path.join(sdk, "lib/d8.jar"),
  "com.android.tools.r8.D8",
  "--lib",
  androidJar,
  "--min-api",
  "26",
  "--output",
  path.join(build, "dex"),
  path.join(build, "classes.jar"),
]);
run(path.join(java, "bin/jar.exe"), [
  "uf",
  path.join(build, "unsigned.apk"),
  "-C",
  path.join(build, "dex"),
  "classes.dex",
]);
run(path.join(sdk, "zipalign.exe"), [
  "-f",
  "-p",
  "4",
  path.join(build, "unsigned.apk"),
  path.join(build, "aligned.apk"),
]);
const apk = path.join(output, "cadeoly-1.1.0.apk");
const signer = path.join(sdk, "lib/apksigner.jar");
run(path.join(java, "bin/java.exe"), [
  "-jar",
  signer,
  "sign",
  "--ks",
  keystore,
  "--ks-key-alias",
  "cadeoly",
  "--ks-pass",
  "env:CADEOLY_SIGNING_PASSWORD",
  "--key-pass",
  "env:CADEOLY_SIGNING_PASSWORD",
  "--out",
  apk,
  path.join(build, "aligned.apk"),
]);
run(path.join(java, "bin/java.exe"), [
  "-jar",
  signer,
  "verify",
  "--verbose",
  apk,
]);
run(path.join(sdk, "aapt.exe"), ["dump", "badging", apk]);
fs.writeFileSync(
  apk + ".sha256",
  crypto.createHash("sha256").update(fs.readFileSync(apk)).digest("hex") +
    "  " +
    path.basename(apk) +
    "\n",
);
console.log("APK ready:", apk);

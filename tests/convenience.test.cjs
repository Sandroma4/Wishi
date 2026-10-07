require("ts-node").register({
  transpileOnly: true,
  compilerOptions: { module: "CommonJS", moduleResolution: "node" },
});
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const { sharedProduct, ownerPreview } = require("../src/lib/convenience.ts");
const { itemSchema } = require("../src/lib/validation.ts");
const { returnPath } = require("../src/lib/return-path.ts");

test("retailer links are bounded, deduplicated and reject credentials and unsafe schemes", () => {
  const gift = { title: "Book", description: "", price: "12", priority: "NORMAL" };
  assert.equal(itemSchema.parse({ ...gift, alternativeUrls: "https://shop.test/a\nhttps://shop.test/a" }).alternativeUrls, "https://shop.test/a");
  for (const alternativeUrls of ["javascript:alert(1)", "https://user:secret@shop.test/a", Array(6).fill("https://shop.test/a").join("\n")])
    assert.equal(itemSchema.safeParse({ ...gift, alternativeUrls }).success, false);
});

test("login preserves a local shared product destination without allowing redirects", () => {
  const path = "/fr/quick-add?url=https%3A%2F%2Fshop.test%2Fp&title=Book";
  assert.equal(returnPath(path, "fr"), path);
  for (const path of ["https://evil.test/fr/quick-add", "//evil.test/fr/quick-add", "/fr/quick-add?next=https://evil.test", "/fr/quick-add#evil"])
    assert.equal(returnPath(path, "fr"), "/fr/dashboard");
});
test("shared input rejects unsafe URLs and extracts a link from shared text", () => {
  assert.equal(sharedProduct({ url: "javascript:alert(1)" }).url, "");
  assert.equal(
    sharedProduct({ text: "Look https://shop.example/product" }).url,
    "https://shop.example/product",
  );
  assert.equal(sharedProduct({ title: "x".repeat(500) }).title.length, 120);
});
test("owner preview removes all reservation and contribution signals and editing rights", () => {
  const preview = ownerPreview({
    isOwner: true,
    canEdit: true,
    items: [
      {
        id: "gift",
        isReserved: true,
        reservedByMe: true,
        contributedCents: 500,
        myContributionCents: 500,
      },
    ],
  });
  assert.equal(preview.canEdit, false);
  assert.equal(preview.items[0].isReserved, false);
  assert.equal(preview.items[0].contributedCents, 0);
});

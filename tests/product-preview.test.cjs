require("ts-node").register({
  transpileOnly: true,
  compilerOptions: { module: "CommonJS", moduleResolution: "node" },
});
const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  publicAddress,
  productUrl,
  parseProduct,
  readPublicResource,
} = require("../src/lib/product-preview.ts");
test("Amazon product fields prefer the actual product and preserve EUR prices", () => {
  const html = `<title>Merchant title</title><span class="a-offscreen">999,00 €</span>
    <span id="productTitle">Caf&eacute; &amp; cadeau</span>
    <span id="apex-pricetopay-accessibility-label">1 249,90 €</span>
    <img id="landingImage" data-a-dynamic-image="{&quot;https://example.com/small.jpg&quot;:[100,100],&quot;https://example.com/large.jpg&quot;:[800,600]}">`;
  assert.deepEqual(parseProduct(html, "https://www.amazon.fr/dp/example"), {
    title: "Café & cadeau", price: "1249.90", image: "https://example.com/large.jpg",
  });
  assert.equal(parseProduct(html, "https://amazon.fr.example.com").price, "");
  assert.equal(parseProduct(html.replace("1 249,90 €", "$1,249.90"), "https://www.amazon.com").price, "");
});
test("Amazon challenge pages do not become proposed gifts", () => {
  assert.deepEqual(parseProduct('<title>Amazon CAPTCHA</title><input id="captchacharacters">', "https://www.amazon.fr"), { title: "", price: "", image: "" });
});
test("product previews reject internal destinations and unsafe schemes", async () => {
  for (const value of [
    "127.0.0.1",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.100.100.200",
    "0.0.0.0",
    "224.0.0.1",
    "::1",
    "::ffff:127.0.0.1",
  ])
    assert.equal(publicAddress(value), false, value);
  assert.equal(publicAddress("8.8.8.8"), true);
  for (const value of [
    "http://example.com",
    "https://user:password@example.com",
    "https://example.com:8443",
    "https://localhost",
    "https://127.0.0.1",
    "file:///tmp/test",
  ]) {
    assert.throws(() => productUrl(value));
  }
  await assert.rejects(() =>
    readPublicResource("https://127.0.0.1", 1024, "html"),
  );
});
test("product metadata handles attribute ordering, escaping and relative images", () => {
  const data = parseProduct(
    `<meta content="Caf&eacute; &amp; cadeau" property="og:title"><meta property='product:price:amount' content='12,50'><meta content='EUR' property='product:price:currency'><meta property='og:image' content='/gift.jpg'>`,
    "https://example.com/products/1",
  );
  assert.equal(data.title, "Café & cadeau");
  assert.equal(data.price, "12.50");
  assert.equal(data.image, "https://example.com/gift.jpg");
  assert.equal(
    parseProduct(
      `<meta property="product:price:amount" content="24"><meta property="product:price:currency" content="USD">`,
      "https://example.com",
    ).price,
    "",
  );
  assert.equal(
    parseProduct(
      `<meta property="og:image" content="https://127.0.0.1/private">`,
      "https://example.com",
    ).image,
    "",
  );
  assert.equal(
    parseProduct("<title>A simple gift</title>", "https://example.com").title,
    "A simple gift",
  );
});

// Run: node --test app/helper/proxyShop.test.mjs
// Uses the real SDK app proxy authenticator with a test secret and in-memory sessions.
import "@shopify/shopify-app-remix/adapters/node";
import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import { test } from "node:test";
import { Session } from "@shopify/shopify-api";
import { ApiVersion, AppDistribution, shopifyApp } from "@shopify/shopify-app-remix/server";
import { verifiedProxyShop } from "./proxyShop.js";

const SECRET = "test-secret";
const SHOP_A = "shop-a.myshopify.com";
const SHOP_B = "shop-b.myshopify.com";

const sessions = new Map(
  [SHOP_A, SHOP_B].map((shop) => [
    `offline_${shop}`,
    new Session({ id: `offline_${shop}`, shop, state: "", isOnline: false, accessToken: "t" }),
  ]),
);
const sessionStorage = {
  storeSession: async () => true,
  loadSession: async (id) => sessions.get(id),
  deleteSession: async () => true,
  deleteSessions: async () => true,
  findSessionsByShop: async () => [],
};

const shopify = shopifyApp({
  apiKey: "test-key",
  apiSecretKey: SECRET,
  apiVersion: ApiVersion.January25,
  scopes: ["read_products"],
  appUrl: "https://app.example.com",
  sessionStorage,
  distribution: AppDistribution.AppStore,
  logger: { level: 0 },
});
const appProxy = shopify.authenticate.public.appProxy;

// Signs the way Shopify does: sorted key=value pairs, concatenated, HMAC-SHA256 hex.
function signedParams(params) {
  const message = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("");
  const signature = createHmac("sha256", SECRET).update(message).digest("hex");
  return new URLSearchParams({ ...params, signature });
}

const base = "https://app.example.com/app-proxy/store-locator/locations";
const params = (shop) => ({
  shop,
  path_prefix: "/apps/store-locator",
  timestamp: String(Math.floor(Date.now() / 1000)),
  lat: "40.7",
  lng: "-74.0",
});

test("a signed request resolves to its own shop", async () => {
  const req = new Request(`${base}?${signedParams(params(SHOP_A))}`);
  assert.deepEqual(await verifiedProxyShop(req, appProxy), { shop: SHOP_A });
});

test("a second shop value in a signed request is rejected", async () => {
  const req = new Request(`${base}?shop=${SHOP_B}&${signedParams(params(SHOP_A))}`);
  const { shop, error } = await verifiedProxyShop(req, appProxy);
  assert.equal(shop, undefined);
  assert.equal(error.status, 400);
});

test("an unsigned request is rejected by the SDK", async () => {
  const req = new Request(`${base}?${new URLSearchParams(params(SHOP_A))}`);
  await assert.rejects(verifiedProxyShop(req, appProxy), (res) => res.status === 400);
});

test("a signed request for a shop without a session is rejected", async () => {
  const req = new Request(`${base}?${signedParams(params("other.myshopify.com"))}`);
  const { error } = await verifiedProxyShop(req, appProxy);
  assert.equal(error.status, 400);
});

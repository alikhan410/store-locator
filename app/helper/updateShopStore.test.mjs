// Run: PRISMA_POSTGRES_DATABASE_URL_PROD=<throwaway postgres, migrated> node --test app/helper/updateShopStore.test.mjs
// Needs a real, migrated, disposable database: it creates and deletes its own rows.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { PrismaClient } from "@prisma/client";
import { updateShopStore } from "./updateShopStore.js";

const prisma = new PrismaClient();
const SHOP_A = "shop-a.myshopify.com";
const SHOP_B = "shop-b.myshopify.com";
let storeA;

before(async () => {
  storeA = await prisma.store.create({
    data: {
      shop: SHOP_A,
      name: "A",
      address: "1 Main St",
      city: "X",
      state: "NY",
      zip: "10001",
    },
  });
});
after(async () => {
  await prisma.store.deleteMany({ where: { shop: { in: [SHOP_A, SHOP_B] } } });
  await prisma.$disconnect();
});

test("the owning shop can update its store", async () => {
  const updated = await updateShopStore(prisma, SHOP_A, storeA.id, {
    name: "A2",
  });
  assert.equal(updated.name, "A2");
});

test("another shop cannot update the store and gets null", async () => {
  assert.equal(
    await updateShopStore(prisma, SHOP_B, storeA.id, { name: "B" }),
    null,
  );
  const row = await prisma.store.findUnique({ where: { id: storeA.id } });
  assert.equal(row.name, "A2");
});

test("an unknown id returns null", async () => {
  assert.equal(
    await updateShopStore(prisma, SHOP_A, "missing", { name: "x" }),
    null,
  );
});

import { Prisma } from "@prisma/client";

// Updates a store only when it belongs to `shop`; returns null when no such store exists.
// The shop predicate sits on the update itself, so there is no check-then-write gap.
export async function updateShopStore(prisma, shop, id, data) {
  try {
    return await prisma.store.update({ where: { id, shop }, data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025")
      return null;
    throw e;
  }
}

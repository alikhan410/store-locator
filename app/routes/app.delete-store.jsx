import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const prisma = (await import("../db.server")).default;

  let storeIds = [];
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    storeIds = Array.isArray(body.storeIds) ? body.storeIds : [];
  } else {
    const formData = await request.formData();
    const ids = formData.getAll("storeIds");
    storeIds = Array.isArray(ids) ? ids : [ids];
  }

  if (!Array.isArray(storeIds) || storeIds.length === 0) {
    return json({ success: false, error: "No store IDs provided" }, { status: 400 });
  }

  try {
    // Only delete stores belonging to the current shop
    const result = await prisma.store.deleteMany({
      where: {
        id: { in: storeIds },
        shop: session.shop,
      },
    });
    return ({ success: true, count: result.count });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return ({ success: false, error: error.message || "Failed to delete stores" }, { status: 500 });
  }
}; 
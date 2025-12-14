import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const storeIds = formData.getAll("storeIds");

  if (!storeIds || storeIds.length === 0) {
    return { success: false, error: "No store IDs provided" };
  }

  try {
    // Delete stores from database
    await db.store.deleteMany({
      where: {
        id: { in: storeIds },
        shop: session.shop,
      },
    });

    return { success: true, message: `${storeIds.length} store(s) deleted successfully` };
  } catch (error) {
    console.error("Error deleting stores:", error);
    return { success: false, error: "Failed to delete stores" };
  }
}; 
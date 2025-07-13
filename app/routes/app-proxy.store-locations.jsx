import prisma from "../db.server";

export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query") || "";
    const tokens = query
      .toLowerCase()
      .split(/[\s,]+/)
      .filter((token) => token && token !== "usa");

    console.log("query tokens are: ", tokens);

    //TODO - FIND ALTERNATIVE WAY FOR QUERYING
    const stores = await prisma.store.findMany({
      where: {
        OR: tokens.flatMap((token) => [
          { city: { contains: token, mode: "insensitive" } },
          { state: { contains: token, mode: "insensitive" } },
          { address: { contains: token, mode: "insensitive" } },
          { address2: { contains: token, mode: "insensitive" } },
          { name: { contains: token, mode: "insensitive" } },
        ]),
      },
    });

    console.log("stores are: ", stores);
    return { stores };
  } catch (error) {
    console.error("Failed to load stores", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

import prisma from "../db.server";

export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query");
    const q = query.toLowerCase();

    const stores = await prisma.store.findMany({
      where: {
        OR: [
          { city: { contains: q } },
          { state: { contains: q } },
          { address: { contains: q } },
          { address2: { contains: q } },
          { name: { contains: q } },
        ],
      },
    });

    return { stores };
  } catch (error) {
    console.error("Failed to load stores", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
// for postgres in  prod
// { city: { contains: q, mode: "insensitive" } },
// { state: { contains: q, mode: "insensitive" } },
// { address: { contains: q, mode: "insensitive" } },
// { address2: { contains: q, mode: "insensitive" } },
// { name: { contains: q, mode: "insensitive" } },

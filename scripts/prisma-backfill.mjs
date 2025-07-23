import prisma from "../app/db.server"
// TO ADD STUFF MANUALLY INTO DB
async function main() {
  const stores = await prisma.store.findMany({
    where: {
      name: {
        contains: 'concord',
        mode: 'insensitive',
      },
    },
  });

  console.log(`Found ${stores.length} matching stores:`);
  stores.forEach((store) => {
    console.log(`- ${store.name} (${store.id})`);
  });
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

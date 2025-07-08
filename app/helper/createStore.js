import prisma from "../db.server";

export async function saveStoreToDB(values) {
  const lat = parseFloat(values.lat || "0");
  const lng = parseFloat(values.lng || "0");

  try {
    const newStore = await prisma.store.create({
      data: {
        name: values.name,
        link: values.link,
        address: values.address,
        address2: values.address2,
        city: values.city,
        state: values.state,
        zip: values.zip,
        lat,
        lng,
        phone: values.phone,
        hours: values.hours,
      },
    });

    return newStore;
  } catch (error) {
    console.error("Error saving store to DB:", error);
    throw new Error("Failed to save store");
  }
}

import { PrismaClient } from "@wishi/prisma-client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  if (
    await prisma.user.findFirst({
      where: {
        email: {
          in: ["alice@example.com", "bob@example.com", "charlie@example.com"],
        },
      },
    })
  ) {
    console.log("Demo accounts already exist; no changes made.");
    return;
  }

  const hashedPassword = await bcrypt.hash("Wishi-demo-2026!", 10);

  // 1. Create Users
  const alice = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@example.com",
      password: hashedPassword,
    },
  });
  const bob = await prisma.user.create({
    data: { name: "Bob", email: "bob@example.com", password: hashedPassword },
  });
  const charlie = await prisma.user.create({
    data: {
      name: "Charlie",
      email: "charlie@example.com",
      password: hashedPassword,
    },
  });

  // 2. Create Family
  await prisma.family.create({
    data: {
      name: "The Awesome Family",
      description: "Our family wishlist space",
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: "ADMIN" },
          { userId: bob.id, role: "MEMBER" },
          { userId: charlie.id, role: "MEMBER" },
        ],
      },
    },
  });

  // 3. Create Wishlists
  const aliceWishlist = await prisma.wishlist.create({
    data: {
      name: "Alice Christmas 2026",
      ownerId: alice.id,
      visibility: "FAMILY",
    },
  });

  const bobWishlist = await prisma.wishlist.create({
    data: {
      name: "Bob Birthday",
      ownerId: bob.id,
      visibility: "FAMILY",
    },
  });

  // 4. Create Items
  const item1 = await prisma.wishlistItem.create({
    data: {
      title: "LEGO Millennium Falcon",
      priceCents: 15000,
      priority: "HIGH",
      wishlistId: aliceWishlist.id,
    },
  });

  await prisma.wishlistItem.create({
    data: {
      title: "Dune Book Boxset",
      priceCents: 4550,
      priority: "NORMAL",
      wishlistId: bobWishlist.id,
    },
  });

  // 5. Create Reservation (Bob reserves Alice's gift)
  await prisma.reservation.create({
    data: {
      itemId: item1.id,
      userId: bob.id,
      quantity: 1,
    },
  });

  console.log("Database seeded successfully!");
  console.log("Test Accounts:");
  console.log("- alice@example.com / Wishi-demo-2026!");
  console.log("- bob@example.com / Wishi-demo-2026!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

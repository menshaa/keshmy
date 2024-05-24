import { prisma } from "../server/database/client";
import { articles } from "./articleData";
import * as bcrypt from "bcrypt";

const run = async () => {
  await prepareDb();

  await Promise.all(
    articles.map(async (article) => {
      return prisma.article.upsert({
        where: {
          id: article.id,
        },
        update: {},
        create: {
          id: article.id,
          title: article.title,
          content: article.content,
          approved: article.approved,
          authorId: article.authorId,
        },
      });
    })
  );
};

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

async function prepareDb() {
  const adminUser = await prisma.user.findUnique({ where: { id: "1" } });
  const testUser = await prisma.user.findUnique({ where: { id: "2" } });
  const hashAdminUser = await bcrypt.hash("admin_user", 10);
  const hashTestUser = await bcrypt.hash("test_user", 10);
  if (!adminUser) {
    await prisma.user.create({
      data: {
        id: "1",
        name: "Admin",
        surname: "User",
        username: "admin_user",
        email: "admin_user@gmail.com",
        password: hashAdminUser,
        approved: true,
        isAdmin: true,
      },
    });
  }
  if (!testUser) {
    await prisma.user.create({
      data: {
        id: "2",
        name: "Test",
        surname: "User",
        username: "test_user",
        email: "test_user@gmail.com",
        password: hashTestUser,
        approved: true,
        isAdmin: false,
      },
    });
  }
}

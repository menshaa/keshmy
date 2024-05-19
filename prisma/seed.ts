import { prisma } from "../server/database/client";
import { articles } from "./articleData";

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
  const user = await prisma.user.findUnique({ where: { id: "1" } });
  if (!user) {
    await prisma.user.create({
      data: {
        id: "1",
        name: "Admin",
        surname: "User",
        username: "admin_user",
        email: "admin_user@gmail.com",
        password: "admin_user",
        approved: true,
        isAdmin: true,
      },
    });
  }
}

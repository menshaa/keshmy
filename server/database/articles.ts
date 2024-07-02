import { Article } from "@prisma/client";
import { prisma } from "./client";
import { DatabaseError } from "./utils";

export const queryArticles = async (
  page: number
): Promise<(Article & { author: { name: string; username: string } })[]> => {
  return await prisma.$queryRaw`
    SELECT a.id, a.title, left(a.content, 250) as content, a."publishDate",
    CASE WHEN s."showRealName" = true THEN CONCAT(author.name, ' ', author.surname) ELSE author.username END as "authorName",
    author.username as "authorUsername"
    FROM "Article" a
    INNER JOIN "User" author
    ON a."authorId" = author.id
    LEFT JOIN "UserSettings" s
    ON s."userId" = author.id
    WHERE a.approved = true
    ORDER BY a."publishDate" DESC
    LIMIT 25 OFFSET ${page * 25};
    `;
};

export const addArticleDB = async (
  title: string,
  content: string,
  authorId: string,
  approved: boolean
): Promise<DatabaseError> => {
  try {
    await prisma.article.create({
      data: {
        title,
        content,
        authorId,
        approved,
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const getArticleById = async (
  id: string
): Promise<Article & { author: { name: string; username: string } }[]> => {
  return await prisma.$queryRaw`
    SELECT a.id, a.title, a.content, a."publishDate",
    CASE WHEN s."showRealName" = true THEN CONCAT(author.name, ' ', author.surname) ELSE author.username END as "authorName",
    author.username as "authorUsername"
    FROM "Article" a
    INNER JOIN "User" author
    ON a."authorId" = author.id
    LEFT JOIN "UserSettings" s
    ON s."userId" = author.id
    WHERE a.id = ${id}
    ORDER BY a."publishDate" DESC;
    `;
};

export const deleteArticleDB = async (
  id: string,
  authorId: string,
  isAdmin: boolean
): Promise<DatabaseError> => {
  try {
    await prisma.$transaction(async (tx) => {
      const article = await tx.article.findUnique({ where: { id } });

      if (!article) {
        return DatabaseError.OPERATION_DEPENDS_ON_REQUIRED_RECORD_THAT_WAS_NOT_FOUND;
      }

      if (!isAdmin && authorId !== article.authorId) {
        return DatabaseError.NOT_AUTHORIZED;
      }

      await tx.article.delete({ where: { id } });
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }
  return DatabaseError.SUCCESS;
};

export const editArticleDB = async (
  id: string,
  payload: any
): Promise<DatabaseError> => {
  try {
    await prisma.article.update({ where: { id }, data: payload });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

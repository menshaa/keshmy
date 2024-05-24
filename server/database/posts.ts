import { Post, PostType } from "@prisma/client";
import { prisma } from "./client";
import { DatabaseError } from "./utils";

export const queryUserPosts = async (
  sessionUserId: string,
  userId: string,
  page: number
): Promise<Post[]> => {
  return await prisma.$queryRaw`
    SELECT p.id, p.content, p."createdAt",
    u.id as "authorId", u.username as "authorUsername", u."avatarURL" as "authorAvatarURL",
    CASE WHEN us."showRealName" = true THEN CONCAT(u.name, ' ', u.surname) ELSE u.username END as "authorName",
    ARRAY_AGG(a.url) FILTER (WHERE a.url IS NOT NULL) as attachments,
    (SELECT COUNT("postId")::INTEGER FROM "PostLike" l WHERE l."postId" = p.id) as likes,
    EXISTS (SELECT "userId" FROM "PostLike" l WHERE l."postId" = p.id AND l."userId" = ${sessionUserId}) as liked,
    (SELECT COUNT(comments)::INTEGER FROM "Post" comments WHERE comments."parentId" = p.id) as comments,
    parent_author.username as "parentAuthorUsername", p.type
    FROM "Post" p
    LEFT JOIN "Post" parent
    ON p."parentId" = parent.id
    LEFT JOIN "User" parent_author
    ON parent."authorId" = parent_author.id
    INNER JOIN "User" u
    ON u.id = p."authorId"
    LEFT JOIN "UserSettings" us
    ON us."userId" = u.id
    LEFT JOIN "PostAttachment" a
    ON a."postId" = p.id
    WHERE p."authorId" = ${userId}
    GROUP BY p.id, u.id, us."showRealName", parent_author.username
    ORDER BY p."createdAt" DESC
    LIMIT 30 OFFSET ${page * 30}
    ;`;
};

export const queryPosts = async (
  userId: string,
  page: number,
  type: PostType = "Global"
): Promise<Post[]> => {
  return await prisma.$queryRaw`
    SELECT p.id, p.content, p."createdAt",
    u.id as "authorId", u.username as "authorUsername", u."avatarURL" as "authorAvatarURL",
    CASE WHEN us."showRealName" = true THEN CONCAT(u.name, ' ', u.surname) ELSE u.username END as "authorName",
    ARRAY_AGG(a.url) FILTER (WHERE a.url IS NOT NULL) as attachments,
    (SELECT COUNT("postId")::INTEGER FROM "PostLike" l WHERE l."postId" = p.id) as likes,
    EXISTS (SELECT "userId" FROM "PostLike" l WHERE l."postId" = p.id AND l."userId" = ${userId}) as liked,
    (SELECT COUNT(comments)::INTEGER FROM "Post" comments WHERE comments."parentId" = p.id) as comments,
    parent_author.username as "parentAuthorUsername", p.type
    FROM "Post" p
    LEFT JOIN "Post" parent
    ON p."parentId" = parent.id
    LEFT JOIN "User" parent_author
    ON parent."authorId" = parent_author.id
    INNER JOIN "User" u
    ON u.id = p."authorId"
    LEFT JOIN "UserSettings" us
    ON us."userId" = u.id
    LEFT JOIN "PostAttachment" a
    ON a."postId" = p.id
    WHERE p.type::text = ${type}
    AND p."groupId" is NULL
    GROUP BY p.id, u.id, us."showRealName", parent_author.username
    ORDER BY p."createdAt" DESC
    LIMIT 30 OFFSET ${page * 30}
    ;`;
};

export const queryPostsByGroupId = async (
  userId: string,
  page: number,
  type: PostType = "Global",
  groupId: string
): Promise<Post[]> => {
  return await prisma.$queryRaw`
    SELECT p.id, p.content, p."createdAt",
    u.id as "authorId", u.username as "authorUsername", u."avatarURL" as "authorAvatarURL",
    CASE WHEN us."showRealName" = true THEN CONCAT(u.name, ' ', u.surname) ELSE u.username END as "authorName",
    ARRAY_AGG(a.url) FILTER (WHERE a.url IS NOT NULL) as attachments,
    (SELECT COUNT("postId")::INTEGER FROM "PostLike" l WHERE l."postId" = p.id) as likes,
    EXISTS (SELECT "userId" FROM "PostLike" l WHERE l."postId" = p.id AND l."userId" = ${userId}) as liked,
    (SELECT COUNT(comments)::INTEGER FROM "Post" comments WHERE comments."parentId" = p.id) as comments,
    parent_author.username as "parentAuthorUsername", p.type, g."name" as "groupName"
    FROM "Post" p
    LEFT JOIN "Post" parent
    ON p."parentId" = parent.id
    LEFT JOIN "User" parent_author
    ON parent."authorId" = parent_author.id
    INNER JOIN "User" u
    ON u.id = p."authorId"
    LEFT JOIN "UserSettings" us
    ON us."userId" = u.id
    LEFT JOIN "PostAttachment" a
    ON a."postId" = p.id
    LEFT JOIN "Group" g
    ON p."groupId" = g.id
    WHERE p.type::text = ${type}
    AND p."groupId" = ${groupId}
    AND p."approved" IS NOT null
    GROUP BY p.id, u.id, us."showRealName", parent_author.username, g."name"
    ORDER BY p."createdAt" DESC
    LIMIT 30 OFFSET ${page * 30}
    ;`;
};

export const queryPost = async (
  userId: string,
  postId: string
): Promise<Post[]> => {
  return await prisma.$queryRaw`
    SELECT p.id, p.content, p."createdAt",
    u.id as "authorId", u.username as "authorUsername", u."avatarURL" as "authorAvatarURL",
    CASE WHEN us."showRealName" = true THEN CONCAT(u.name, ' ', u.surname) ELSE u.username END as "authorName",
    ARRAY_AGG(a.url) FILTER (WHERE a.url IS NOT NULL) as attachments,
    (SELECT COUNT("postId")::INTEGER FROM "PostLike" l WHERE l."postId" = p.id) as likes,
    EXISTS (SELECT "userId" FROM "PostLike" l WHERE l."postId" = p.id AND l."userId" = ${userId}) as liked,
    (SELECT COUNT(comments)::INTEGER FROM "Post" comments WHERE comments."parentId" = p.id) as comments,
    parent_author.username as "parentAuthorUsername", p.type
    FROM "Post" p
    LEFT JOIN "Post" parent
    ON p."parentId" = parent.id
    LEFT JOIN "User" parent_author
    ON parent."authorId" = parent_author.id
    INNER JOIN "User" u
    ON u.id = p."authorId"
    LEFT JOIN "UserSettings" us
    ON us."userId" = u.id
    LEFT JOIN "PostAttachment" a
    ON a."postId" = p.id
    WHERE p.id = ${postId}
    GROUP BY p.id, u.id, us."showRealName", parent_author.username
    ;`;
};

export const queryComments = async (
  userId: string,
  postId: string,
  page: number
) => {
  return await prisma.$queryRaw`
    SELECT p.id, p.content, p."createdAt",
    u.id as "authorId", u.username as "authorUsername", u."avatarURL" as "authorAvatarURL",
    CASE WHEN us."showRealName" = true THEN CONCAT(u.name, ' ', u.surname) ELSE u.username END as "authorName",
    ARRAY_AGG(a.url) FILTER (WHERE a.url IS NOT NULL) as attachments,
    (SELECT COUNT("postId")::INTEGER FROM "PostLike" l WHERE l."postId" = p.id) as likes,
    EXISTS (SELECT "userId" FROM "PostLike" l WHERE l."postId" = p.id AND l."userId" = ${userId}) as liked,
    (SELECT COUNT(comments)::INTEGER FROM "Post" comments WHERE comments."parentId" = p.id) as comments,
    parent_author.username as "parentAuthorUsername", p.type
    FROM "Post" p
    LEFT JOIN "Post" parent
    ON p."parentId" = parent.id
    LEFT JOIN "User" parent_author
    ON parent."authorId" = parent_author.id
    INNER JOIN "User" u
    ON u.id = p."authorId"
    LEFT JOIN "UserSettings" us
    ON us."userId" = u.id
    LEFT JOIN "PostAttachment" a
    ON a."postId" = p.id
    WHERE p."parentId" = ${postId}
    GROUP BY p.id, u.id, us."showRealName", parent_author.username
    ORDER BY p."createdAt" DESC
    LIMIT 20 OFFSET ${page * 20}
    ;`;
};

export const createPostDB = async (
  id: string,
  userId: string,
  content: string | undefined,
  attachmentsURLs: string[],
  parentId: string | undefined,
  type: PostType = "Global",
  groupId: string | undefined
): Promise<DatabaseError> => {
  try {
    await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          id,
          content,
          authorId: userId,
          parentId,
          type,
          ...(groupId ? { groupId } : {}),
        },
      });

      await tx.postAttachment.createMany({
        data: [
          ...attachmentsURLs.map((url) => ({ postId: post.id, url: url })),
        ],
      });
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const deletePostDB = async (
  postId: string,
  userId: string
): Promise<DatabaseError> => {
  try {
    const affected = (
      await prisma.post.deleteMany({
        where: {
          AND: [{ id: { equals: postId } }, { authorId: { equals: userId } }],
        },
      })
    ).count;

    if (!affected)
      return DatabaseError.OPERATION_DEPENDS_ON_REQUIRED_RECORD_THAT_WAS_NOT_FOUND;
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const likePostDB = async (
  postId: string,
  userId: string
): Promise<DatabaseError> => {
  try {
    await prisma.postLike.create({
      data: {
        postId,
        userId,
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const unlikePostDB = async (
  postId: string,
  userId: string
): Promise<DatabaseError> => {
  try {
    const affected = await prisma.postLike.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (!affected)
      return DatabaseError.OPERATION_DEPENDS_ON_REQUIRED_RECORD_THAT_WAS_NOT_FOUND;
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const getPostByIdDB = async (postId: string) => {
  return prisma.post.findFirst({
    where: {
      id: postId,
    },
  });
};

export const updatePostDB = async (postId: string, updatedPayload: any) => {
  return prisma.post.update({
    where: {
      id: postId,
    },
    data: updatedPayload,
  });
};

export const getPostRequestsDB = async (groupId: string, page: number) => {
  return prisma.post.findMany({
    where: {
      groupId,
      approved: null,
    },
    take: 30,
    skip: page * 30,
  });
};

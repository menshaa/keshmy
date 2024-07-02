import { Request, Response } from "express";
import { DatabaseError } from "../database/utils";
import {
  createPostDB,
  deletePostDB,
  likePostDB,
  queryPosts,
  queryPost,
  queryUserPosts,
  unlikePostDB,
  queryComments,
  queryPostsByGroupId,
  getPostByIdDB,
  updatePostDB,
  getPostRequestsDB,
} from "../database/posts";
import {
  CreatePostData,
  DeletePostData,
  GetPostData,
  GetPostsData,
  LikePostData,
  UpdateGroupPostStatusData,
} from "../validators/posts";
import { GetPagedData } from "../validators/general";
import fs from "fs/promises";
import { snowflake } from "../database/snowflake";
import { traversalSafeRm } from "../utils";
import {
  findWhiteListDB,
  getGroupByIdDB,
  getGroupMemberRecordDB,
} from "../database/groups";

export async function getUserPosts(req: Request, res: Response) {
  const data = GetPostsData.safeParse(req.params);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  const posts = await queryUserPosts(
    req.session.user.id,
    data.data.id,
    data.data.page
  );

  return res
    .status(200)
    .json({ message: "Successfully fetched user posts", posts });
}

export async function getPosts(req: Request, res: Response) {
  const data = GetPagedData.safeParse(req.params);
  const { groupId } = req.query;

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  const posts =
    groupId && groupId !== "undefined"
      ? await queryPostsByGroupId(
          req.session.user.id,
          data.data.page,
          "Global",
          groupId.toString()
        )
      : await queryPosts(req.session.user.id, data.data.page, "Global");

  return res.status(200).json({ message: "Successfully fetched posts", posts });
}

export async function getPost(req: Request, res: Response) {
  const data = GetPostData.safeParse(req.params);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  const posts = await queryPost(req.session.user.id, data.data.id);

  return res
    .status(200)
    .json({ message: "Successfully fetched post", post: posts[0] });
}

export async function getComments(req: Request, res: Response) {
  const data = GetPostsData.safeParse(req.params);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  const comments = await queryComments(
    req.session.user.id,
    data.data.id,
    data.data.page
  );

  return res
    .status(200)
    .json({ message: "Successfully fetched comments", comments });
}

export async function createPost(req: Request, res: Response) {
  const data = CreatePostData.safeParse(req.body);
  const { groupId } = req.query;

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  const attachmentsURLs = <string[]>[];
  const attachmentsPaths = <string[]>[];

  const id = snowflake.getUniqueID();
  let counter = 1;

  const attachments = req.files?.attachments
    ? Array.isArray(req.files.attachments)
      ? [...req.files.attachments]
      : [req.files.attachments]
    : [];
  for (const attachment of attachments) {
    const fileName = counter;
    const dir = `${__dirname}/../cdn/posts/${id}`;

    const ext = attachment.mimetype.split("/").at(-1);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(`${dir}/${fileName}.${ext}`, attachment.data);

    attachmentsURLs.push(
      `http://${req.headers.host}/cdn/posts/${id}/${fileName}.${ext}`
    );
    attachmentsPaths.push(`${dir}/${fileName}.${ext}`);
    counter++;
  }

  /**
   * The following logic ensures that group admins' AND whitelisted members' posts will immediately be approved
   */
  let approved = undefined;
  const userId = req.session.user.id;
  if (groupId) {
    const targetGroup = await getGroupByIdDB(groupId.toString());
    if (!targetGroup) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (targetGroup.creatorId !== userId) {
      const targetGroupMemberRecord = await getGroupMemberRecordDB(
        groupId.toString(),
        userId
      );
      if (!targetGroupMemberRecord) {
        return res
          .status(404)
          .json({ message: "Group member record not found" });
      }

      if (targetGroupMemberRecord.isAdmin) {
        approved = true;
      }
      const whiteListRecord = await findWhiteListDB(groupId.toString(), userId);
      if (whiteListRecord) {
        approved = true;
      }
    } else {
      approved = true;
    }
  }

  const error = await createPostDB(
    id.toString(),
    req.session.user.id,
    data.data.content,
    attachmentsURLs,
    data.data.parentId,
    data.data.type,
    groupId?.toString(),
    approved
  );

  if (error === DatabaseError.UNKNOWN) {
    attachmentsPaths.forEach(async (path) => {
      await fs.rm(path, { recursive: true, force: true });
    });
    return res
      .status(500)
      .json({ message: "An internal error occurred while creating the post" });
  }

  return res.status(201).json({ message: "Successfully created post" });
}

export async function deletePost(req: Request, res: Response) {
  const data = DeletePostData.safeParse(req.query);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  const error = await deletePostDB(data.data.postId, req.session.user.id);

  if (error === DatabaseError.UNKNOWN) {
    return res
      .status(500)
      .json({ message: "An error occurred while deleting your post" });
  } else if (
    error ===
    DatabaseError.OPERATION_DEPENDS_ON_REQUIRED_RECORD_THAT_WAS_NOT_FOUND
  ) {
    return res.status(404).json({ message: "Post not found" });
  }

  await traversalSafeRm("posts", data.data.postId);

  return res.status(200).json({ message: "Successfully deleted post" });
}

export async function likePost(req: Request, res: Response) {
  const data = LikePostData.safeParse(req.params);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  const error = await likePostDB(data.data.postId, req.session.user.id);

  if (error === DatabaseError.UNKNOWN) {
    return res.status(500).json({ message: "An internal error occurred" });
  } else if (
    error ===
    DatabaseError.OPERATION_DEPENDS_ON_REQUIRED_RECORD_THAT_WAS_NOT_FOUND
  ) {
    return res.status(404).json({ message: "Post not found" });
  }

  return res.sendStatus(200);
}

export async function unlikePost(req: Request, res: Response) {
  const data = LikePostData.safeParse(req.params);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  const error = await unlikePostDB(data.data.postId, req.session.user.id);

  if (error === DatabaseError.UNKNOWN) {
    return res.status(500).json({ message: "An internal error occurred" });
  } else if (
    error ===
    DatabaseError.OPERATION_DEPENDS_ON_REQUIRED_RECORD_THAT_WAS_NOT_FOUND
  ) {
    return res.status(404).json({ message: "Post not found" });
  }

  return res.sendStatus(200);
}

export async function getGroupPostRequests(req: Request, res: Response) {
  const { groupId, page } = req.params;

  const postRequests = await getPostRequestsDB(groupId, Number(page));

  return res.status(200).json({
    message: "Successfully fetched group post requests",
    posts: postRequests,
  });
}

export async function updateGroupPostStatus(req: Request, res: Response) {
  const loggedInUserId = req.session.user.id;
  const postId = req.params.postId;
  const response = UpdateGroupPostStatusData.safeParse(req.body);
  if (!response.success) {
    return res.status(400).json({ message: response.error.errors[0].message });
  }

  const targetPost = await getPostByIdDB(postId);
  // Ensuring the post belongs to a group
  if (!targetPost || !targetPost?.groupId) {
    return res.status(404).json({ message: "Post not found" });
  }

  if (!response.data.approved && !response.data.rejectReason) {
    return res
      .status(400)
      .json({ message: "Please provide a rejection reason" });
  }
  const targetGroup = await getGroupByIdDB(targetPost.groupId);
  if (!targetGroup) {
    return res.status(404).json({ message: "Group not found." });
  }
  if (targetGroup.creatorId !== loggedInUserId) {
    const groupMemberRecordForLoggedInUser = await getGroupMemberRecordDB(
      targetPost.groupId,
      loggedInUserId
    );
    if (!groupMemberRecordForLoggedInUser) {
      return res
        .status(404)
        .json({ message: "Group member record not found." });
    }

    if (!groupMemberRecordForLoggedInUser.isAdmin) {
      return res
        .status(400)
        .json({ message: "Only group admins can update post statuses" });
    }
  }

  await updatePostDB(postId, response.data);
  return res.status(201).json({ message: "Successfully updated post request" });
}

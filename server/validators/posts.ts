import z from "zod";
import { GetPagedData } from "./general";

const PostType = z.enum(["Global", "Club"], {
  required_error: "Invalid post type",
});

export const GetPostsData = GetPagedData.extend({
  id: z.string().min(1, "ID cannot be empty"),
});

export const GetPostData = z.object({
  id: z.string().min(1, "ID cannot be empty"),
});

export const CreatePostData = z.object({
  parentId: z.string().optional(),
  content: z.string().optional(),
  type: PostType.default("Global"),
});

export const DeletePostData = z.object({
  postId: z.string().min(1, "Post ID cannot be empty"),
});

export const LikePostData = z.object({
  postId: z.string().min(1, "Post ID cannot be empty"),
});

export const UpdateGroupPostStatusData = z.object({
  approved: z.boolean(),
  rejectReason: z.string().optional(),
});

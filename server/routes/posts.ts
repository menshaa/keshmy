import express from "express";
import { sessionGuard } from "../controllers/utils/middleware";
import {
  createPost,
  deletePost,
  getPost,
  getPosts,
  getComments,
  getUserPosts,
  likePost,
  unlikePost,
  getGroupPostRequests,
  updateGroupPostStatus,
} from "../controllers/posts";
const router = express.Router();

router.get("/get-user-posts/:id/:page", sessionGuard, getUserPosts);
router.get("/get-all-posts/:page", sessionGuard, getPosts);
router.get("/get-post/:id", sessionGuard, getPost);
router.get("/get-comments/:id/:page", sessionGuard, getComments);
router.post("/create-post", sessionGuard, createPost);
router.patch("/like/:postId", sessionGuard, likePost);
router.patch("/unlike/:postId", sessionGuard, unlikePost);
router.delete("/delete-post", sessionGuard, deletePost);
router.get(
  "/get-group-post-requests/:groupId/:page",
  sessionGuard,
  getGroupPostRequests
);
router.patch("/:postId/status", sessionGuard, updateGroupPostStatus);

export default router;

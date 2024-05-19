import express from "express";
import { createPost } from "../controllers/posts";
import { getMembers, getPosts } from "../controllers/club";
import { clubMemberGuard, sessionGuard } from "../controllers/utils/middleware";
const router = express.Router();

router.get("/get-members/:page", sessionGuard, getMembers);
router.get("/get-all-posts/:page", sessionGuard, getPosts);

router.post("/create-post", sessionGuard, clubMemberGuard, createPost);

export default router;

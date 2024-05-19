import express from "express";
import {
    createGroup,
    joinGroup,
    getGroups,
    getMyGroups,
    getGroup,
} from "../controllers/groups";
import { sessionGuard } from "../controllers/utils/middleware";
const router = express.Router();

router.post("/create-group", sessionGuard, createGroup);
router.post("/:id/join-group", sessionGuard, joinGroup);
router.get("/", sessionGuard, getGroups);
router.get("/my-groups", sessionGuard, getMyGroups);
router.get("/:id", sessionGuard, getGroup);

export default router;

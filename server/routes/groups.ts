import express from "express";
import {
    createGroup,
    joinGroup,
    getGroups,
    getMyGroups,
    getGroup,
    getGroupRequests,
    updateGroupRequest,
    updateUserAdminStatus
} from "../controllers/groups";
import { sessionGuard, adminGuard } from "../controllers/utils/middleware";
const router = express.Router();

router.post("/create-group", sessionGuard, createGroup);
router.post("/:groupId/join-group", sessionGuard, joinGroup);
router.get("/", sessionGuard, getGroups);
router.get("/my-groups", sessionGuard, getMyGroups);
router.get("/:groupId", sessionGuard, getGroup);
router.get("/requests", adminGuard, getGroupRequests);
router.patch("/:groupId/request", adminGuard, updateGroupRequest);
router.patch("/:groupId/user/:userId/admin-status", sessionGuard, updateUserAdminStatus);

export default router;

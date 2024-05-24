import express from "express";
import {
  createGroup,
  joinGroup,
  getGroups,
  getMyGroups,
  getGroup,
  getGroupRequests,
  updateGroupRequest,
  updateUserAdminStatus,
  getGroupMembers,
  getGroupPendingMembers,
  updateUserJoinRequest
} from "../controllers/groups";
import { sessionGuard, adminGuard } from "../controllers/utils/middleware";
const router = express.Router();

router.post("/create-group", sessionGuard, createGroup);
router.post("/:groupId/join-group", sessionGuard, joinGroup);
router.get("/", sessionGuard, getGroups);
router.get("/my-groups", sessionGuard, getMyGroups);
router.get("/requests", adminGuard, getGroupRequests);
router.get("/:groupId", sessionGuard, getGroup);
router.patch("/:groupId/request", adminGuard, updateGroupRequest);
router.patch(
  "/:groupId/member/:userId/admin-status",
  sessionGuard,
  updateUserAdminStatus
);
router.get("/:groupId/pending-members", sessionGuard, getGroupPendingMembers);
router.patch("/:groupId/member/:userId/join-request", sessionGuard, updateUserJoinRequest);
router.get("/:groupId/members", sessionGuard, getGroupMembers);

export default router;

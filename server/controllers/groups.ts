import { Request, Response } from "express";
import {
  CreateGroupData,
  PatchGroupRequestData,
  PatchUserAdminStatusData,
} from "../validators/groups";
import { snowflake } from "../database/snowflake";
import {
  createGroupDB,
  getGroupByIdDB,
  getGroupDB,
  getGroupsDB,
  getMyGroupsDB,
  getPendingGroupsDB,
  joinGroupDB,
  updateGroupDB,
  updateGroupMemberDB,
  getGroupMemberRecordDB,
} from "../database/groups";
import { DatabaseError } from "../database/utils";

export async function createGroup(req: Request, res: Response) {
  const response = CreateGroupData.safeParse(req.body);
  if (!response.success) {
    return res.status(400).json({ message: response.error.errors[0].message });
  }

  const id = snowflake.getUniqueID();
  const userId = req.session.user.id;
  const creationResponse = await createGroupDB(
    id.toString(),
    response.data.name,
    response.data.description,
    userId
  );

  if (creationResponse === DatabaseError.UNKNOWN) {
    return res.status(500).json({ message: "An internal error has occurred" });
  }

  return res.status(201).json({ message: "Group has been created" });
}
export async function joinGroup(req: Request, res: Response) {
  const userId = req.session.user.id;
  const groupId = req.params.groupId;

  const targetGroup = await getGroupByIdDB(groupId);
  if (!targetGroup) {
    return res.status(404).json({ message: "Group not found." });
  }

  const id = snowflake.getUniqueID();
  await joinGroupDB(id.toString(), userId, groupId);
  return res.status(201).json({ message: "Group joined successfully" });
}
export async function getGroups(req: Request, res: Response) {
  const userId = req.session.user.id;
  const groups = await getGroupsDB(userId);
  return res
    .status(200)
    .json({ message: "Successfully fetched groups", groups });
}
export async function getMyGroups(req: Request, res: Response) {
  const userId = req.session.user.id;
  const groups = await getMyGroupsDB(userId);
  return res
    .status(200)
    .json({ message: "Successfully fetched groups", groups });
}

export async function getGroup(req: Request, res: Response) {
  const groupId = req.params.groupId;
  const group = await getGroupDB(groupId);
  return res.status(200).json({ message: "Successfully fetched group", group });
}

export async function getGroupRequests(req: Request, res: Response) {
  const groups = await getPendingGroupsDB();
  return res
    .status(200)
    .json({ message: "Successfully fetched pending groups", groups });
}

export async function updateGroupRequest(req: Request, res: Response) {
  const groupId = req.params.groupId;
  const response = PatchGroupRequestData.safeParse(req.body);
  if (!response.success) {
    return res.status(400).json({ message: response.error.errors[0].message });
  }
  if (!response.data.approved && !response.data.rejectReason) {
    return res
      .status(400)
      .json({ message: "Please provide a rejection reason" });
  }
  await updateGroupDB(groupId, response.data);
  return res
    .status(201)
    .json({ message: "Successfully updated group request" });
}

export async function updateUserAdminStatus(req: Request, res: Response) {
  const loggedInUserId = req.session.user.id;
  const { groupId, userId } = req.params;
  const response = PatchUserAdminStatusData.safeParse(req.body);
  if (!response.success) {
    return res.status(400).json({ message: response.error.errors[0].message });
  }

  const targetGroup = await getGroupByIdDB(groupId);
  if (!targetGroup) {
    return res.status(404).json({ message: "Group not found." });
  }

  /**
   * If another admin of a group tries to remove admin status of group creator
   * An error message will be returned
   */
  if (!response.data.isAdmin && targetGroup.creatorId === userId) {
    return res
      .status(400)
      .json({ message: "Group creators cannot be demoted" });
  }

  const groupMemberRecordForLoggedInUser = await getGroupMemberRecordDB(
    groupId,
    loggedInUserId
  );
  if (!groupMemberRecordForLoggedInUser) {
    return res.status(404).json({ message: "Group member record not found." });
  }

  if (!groupMemberRecordForLoggedInUser.isAdmin) {
    return res
      .status(400)
      .json({ message: "Only group admins can update admin statuses" });
  }

  const groupMemberRecordForTargetUser = await getGroupMemberRecordDB(
    groupId,
    userId
  );
  if (!groupMemberRecordForTargetUser) {
    return res.status(404).json({ message: "Group member record not found." });
  }

  await updateGroupMemberDB(groupMemberRecordForTargetUser.id, {
    isAdmin: response.data.isAdmin,
  });

  return res
    .status(201)
    .json({ message: "Successfully updated user admin status" });
}

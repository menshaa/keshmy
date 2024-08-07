import { Request, Response } from "express";
import {
  CreateGroupData,
  GetGroupMembersData,
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
  getGroupMembersDB,
  getGroupAdmins,
  getOtherAdminsInGroupDB,
  deleteGroupMemberRecordDB,
  updateGroupCreatorDB,
  addToWhiteListDB,
  removeFromWhiteListDB,
  findWhiteListDB,
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
  const admins = await getGroupAdmins(groupId);
  return res
    .status(200)
    .json({ message: "Successfully fetched group", data: { group, admins } });
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

  if (targetGroup.creatorId !== loggedInUserId) {
    const groupMemberRecordForLoggedInUser = await getGroupMemberRecordDB(
      groupId,
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
        .json({ message: "Only group admins can update admin statuses" });
    }
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

export async function getGroupPendingMembers(req: Request, res: Response) {
  const response = GetGroupMembersData.safeParse(req.params);
  const { page } = req.query;

  if (!response.success) {
    return res.status(400).json({ message: response.error.errors[0].message });
  }

  const { groupId } = response.data;

  const approvedStatus = undefined;
  const members = await getGroupMembersDB(
    groupId,
    Number(page),
    approvedStatus
  );
  return res
    .status(200)
    .json({ message: "Successfully fetched groups", members });
}

export async function getGroupMembers(req: Request, res: Response) {
  const response = GetGroupMembersData.safeParse(req.params);
  const { page } = req.query;

  if (!response.success) {
    return res.status(400).json({ message: response.error.errors[0].message });
  }

  const { groupId } = response.data;

  const approvedStatus = true;
  const groupMemberRecords: any = await getGroupMembersDB(
    groupId,
    Number(page),
    approvedStatus
  );

  const group = await getGroupByIdDB(groupId);
  if (!group) {
    return res.status(404).json({ message: "Group not found." });
  }

  const members = await Promise.all(
    groupMemberRecords.map(async (record: any) => {
      return {
        ...record.user,
        isGroupAdmin: record.isAdmin,
        isWhiteListed: !!(await findWhiteListDB(groupId, record.userId)),
      };
    })
  );
  members.unshift({ ...group.creator, isWhiteListed: true });

  return res.status(200).json({
    message: "Successfully fetched members",
    members: members.map((m: any) => {
      return {
        id: m.id,
        username: m.username,
        avatarURL: m.avatarURL,
        name: m.name,
        isGroupAdmin: group.creatorId === m.id || m.isGroupAdmin === true,
        isWhiteListed: m.isWhiteListed,
      };
    }),
  });
}

export async function updateUserJoinRequest(req: Request, res: Response) {
  const loggedInUserId = req.session.user.id;
  const { groupId, userId } = req.params;
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
      .json({ message: "Only group admins can approve/reject users" });
  }

  const groupMemberRecord = await getGroupMemberRecordDB(userId, groupId);
  if (!groupMemberRecord) {
    return res.status(404).json({ message: "Group member record not found." });
  }
  await updateGroupMemberDB(groupMemberRecord.id, { approved: true });
  return res
    .status(201)
    .json({ message: "Successfully updated user group request" });
}

export async function leaveGroup(req: Request, res: Response) {
  const userId = req.session.user.id;
  const groupId = req.params.groupId;
  const targetGroup = await getGroupByIdDB(groupId);
  if (!targetGroup) {
    return res.status(404).json({ message: "Group not found." });
  }

  const otherAdmins = await getOtherAdminsInGroupDB(userId, groupId);
  if (!otherAdmins || !otherAdmins?.length) {
    return res.status(400).json({
      message:
        "Please ensure you have assigned an admin before you leave the group",
    });
  }

  const newCreatorId = otherAdmins[0].userId;
  const newCreatorGroupMemberRecordId = otherAdmins[0].id;

  const groupMemberRecord = await getGroupMemberRecordDB(groupId, userId);
  if (groupMemberRecord) {
    await deleteGroupMemberRecordDB(groupMemberRecord.id);
  } else {
    await updateGroupCreatorDB(groupId, newCreatorId);
    await deleteGroupMemberRecordDB(newCreatorGroupMemberRecordId);
  }

  return res.status(201).json({ message: "Group left successfully" });
}

export async function addToWhiteList(req: Request, res: Response) {
  const userId = req.session.user.id;
  const { groupId, userId: targetMemberId } = req.params;

  const targetGroup = await getGroupByIdDB(groupId);
  if (!targetGroup) {
    return res.status(404).json({ message: "Group not found." });
  }

  const groupMemberRecord = await getGroupMemberRecordDB(groupId, userId);
  if (targetGroup.creatorId !== userId && !groupMemberRecord) {
    return res.status(401).json({ message: "Unauthorized." });
  }
  const id = snowflake.getUniqueID();
  await addToWhiteListDB(id.toString(), groupId, targetMemberId);

  return res
    .status(201)
    .json({ message: "Member added to whitelist successfully" });
}

export async function removeFromWhiteList(req: Request, res: Response) {
  const userId = req.session.user.id;
  const { groupId, userId: targetMemberId } = req.params;

  const targetGroup = await getGroupByIdDB(groupId);
  if (!targetGroup) {
    return res.status(404).json({ message: "Group not found." });
  }

  const groupMemberRecord = await getGroupMemberRecordDB(groupId, userId);
  if (targetGroup.creatorId !== userId && !groupMemberRecord) {
    return res.status(401).json({ message: "Unauthorized." });
  }
  const whiteListRecord = await findWhiteListDB(groupId, targetMemberId);
  if (whiteListRecord) {
    await removeFromWhiteListDB(whiteListRecord.id);
  }

  return res
    .status(201)
    .json({ message: "Member removed from whitelist successfully" });
}

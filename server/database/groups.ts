import { DatabaseError } from "./utils";
import { prisma } from "./client";

export const createGroupDB = async (
  id: string,
  name: string,
  description: string,
  creatorId: string
): Promise<DatabaseError> => {
  try {
    await prisma.group.create({
      data: {
        id,
        name,
        description,
        creatorId,
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const getGroupByIdDB = async (id: string) => {
  return prisma.group.findFirst({
    where: {
      id,
    },
    include: {
      creator: true,
    },
  });
};

export const joinGroupDB = async (
  id: string,
  userId: string,
  groupId: string
) => {
  try {
    await prisma.groupMembers.create({
      data: {
        id,
        userId,
        groupId,
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const getGroupsDB = async (userId: string) => {
  const joinedGroups = await prisma.groupMembers.findMany({
    where: {
      userId,
    },
  });

  const joinedGroupIds = joinedGroups.map(
    (joinedGroup: any) => joinedGroup.groupId
  );

  const availableGroups = await prisma.group.findMany({
    where: {
      creatorId: {
        notIn: userId,
      },
      approved: true,
    },
    include: {
      creator: true,
    },
  });

  return availableGroups.map((availableGroup: any) => {
    return {
      ...availableGroup,
      isJoined: joinedGroupIds.includes(availableGroup.id),
    };
  });
};

export const getMyGroupsDB = async (userId: string) => {
  const joinedGroups = await prisma.groupMembers.findMany({
    where: {
      userId,
    },
    include: {
      group: true,
    },
  });

  const ownedGroups = await prisma.group.findMany({
    where: {
      creatorId: userId,
    },
  });

  const combinedGroups = [
    ...ownedGroups,
    ...(joinedGroups.length
      ? joinedGroups.map((joinedGroup: any) => joinedGroup.group)
      : []),
  ];

  const uniqueGroups: any = {};
  combinedGroups.map((group) => {
    uniqueGroups[group.id] = group;
  });

  return Object.values(uniqueGroups);
};

export const getGroupDB = async (groupId: string) => {
  return prisma.group.findFirst({
    where: {
      id: groupId,
    },
    include: {
      creator: true,
    },
  });
};

export const getPendingGroupsDB = async () => {
  return prisma.group.findMany({
    where: {
      approved: null,
    },
    include: {
      creator: true,
    },
  });
};

export const updateGroupDB = async (groupId: string, updatedPayload: any) => {
  return prisma.group.update({
    where: {
      id: groupId,
    },
    data: updatedPayload,
  });
};

export const getGroupMemberRecordDB = async (
  groupId: string,
  userId: string
) => {
  return prisma.groupMembers.findFirst({
    where: {
      userId,
      groupId,
    },
  });
};

export const updateGroupMemberDB = async (
  groupMemberId: string,
  updatedPayload: any
) => {
  return prisma.groupMembers.update({
    where: {
      id: groupMemberId,
    },
    data: updatedPayload,
  });
};

export const getGroupMembersDB = async (
  groupId: string,
  page: number,
  approvedStatus: boolean | undefined
) => {
  return prisma.groupMembers.findMany({
    where: {
      groupId,
      // approved: approvedStatus,
    },
    take: 30,
    skip: page * 30,
    include: {
      user: true,
    },
  });
};

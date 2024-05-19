import { DatabaseError } from "./utils";
// import { Group, GroupMembers } from "@prisma/client";
import { prisma } from "./client";

export const createGroupDB = async (
    id: string,
    name: string,
    description: string,
    creatorId: string,
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
    });
};

export const joinGroupDB = async (id: string, userId: string, groupId: string) => {
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

    const joinedGroupIds = joinedGroups.map((joinedGroup: any) => joinedGroup.groupId);

    const availableGroups = await prisma.group.findMany({
        where: {
            creatorId: {
                notIn: userId,
            },
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

    if (joinedGroups.length) {
    }

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
    });
};

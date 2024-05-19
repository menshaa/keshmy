import { User } from "@prisma/client";
import { prisma } from "./client";

export const queryClubMembers = async (page: number): Promise<User[]> => {
    return await prisma.$queryRaw`
    SELECT u.id, u.username, u."avatarURL",
    CASE WHEN s."showRealName" = true THEN CONCAT(u.name, ' ', u.surname) ELSE u.username END as name
    FROM "User" u
    LEFT JOIN "UserSettings" s
    ON u.id = s."userId"
    WHERE u.approved = true AND u."isClubMember" = true
    LIMIT 15 OFFSET ${page * 15}
    ;`;
};

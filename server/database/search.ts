import { Announcement, Article, Event, Job, User } from "@prisma/client";
import { prisma } from "./client";

export const searchUsers = async (query: string, page: number, limit = 20): Promise<User[]> => {
    return await prisma.$queryRaw`
    SELECT u.id, u.username, u."avatarURL",
    CASE WHEN s."showRealName" = true THEN CONCAT(u.name, ' ', u.surname) ELSE u.username END as name,
    s."allowAllDMs"
    FROM "User" u
    LEFT JOIN "UserSettings" s
    ON u.id = s."userId"
    WHERE u.approved = true AND (u.username ILIKE ${`%${query}%`} OR
    CASE WHEN s."showRealName" = true THEN u.name ILIKE ${`%${query}%`} OR u.surname ILIKE ${`%${query}%`} ELSE NULL END OR
    CASE WHEN s."showEmail" = true THEN u.email ILIKE ${`%${query}%`} ELSE NULL END)
    LIMIT ${limit} OFFSET ${page * limit}
    ;`;
};

export const searchAnnouncements = async (query: string, page: number, limit = 20): Promise<Announcement[]> => {
    return await prisma.$queryRaw`
    SELECT id, title, "publishDate", left(content, 250) as content
    FROM "Announcement"
    WHERE approved = true AND title ILIKE ${`%${query}%`}
    LIMIT ${limit} OFFSET ${page * limit}
    ;`;
};

export const searchArticles = async (query: string, page: number, limit = 20): Promise<Article[]> => {
    return await prisma.$queryRaw`
    SELECT a.id, a.title, a."publishDate", left(a.content, 250) as content, author.username as "authorUsername",
    CASE WHEN s."showRealName" = true THEN CONCAT(author.name, ' ', author.surname) ELSE author.username END as "authorName"
    FROM "Article" a
    INNER JOIN "User" author
    ON a."authorId" = author.id
    LEFT JOIN "UserSettings" s
    ON s."userId" = author.id
    WHERE a.approved = true AND a.title ILIKE ${`%${query}%`} OR
    CASE WHEN s."showRealName" = true THEN author.name ILIKE ${`%${query}%`} OR author.surname ILIKE ${`%${query}%`} ELSE author.username ILIKE ${`%${query}%`} END OR
    CASE WHEN s."showEmail" = true THEN author.email ILIKE ${`%${query}%`} ELSE NULL END
    LIMIT ${limit} OFFSET ${page * limit}
    ;`;
};

export const searchEvents = async (query: string, userId: string, page: number, limit = 20): Promise<Event[]> => {
    return await prisma.$queryRaw`
    SELECT id, title, time, location, "imageURL", description,
    COUNT(i."userId")::INTEGER as interest,
    EXISTS (SELECT "userId" FROM "EventInterest" WHERE "userId" = ${userId} AND "eventId" = id) as "isInterested"
    FROM "Event"
    LEFT JOIN "EventInterest" i
    ON i."eventId" = id
    WHERE approved = true AND title ILIKE ${`%${query}%`} OR location ILIKE ${`%${query}%`}
    GROUP BY id
    ORDER BY time < now(), time ASC
    LIMIT ${limit} OFFSET ${page * limit}
    ;`;
};

export const searchJobs = async (query: string, page: number, limit = 20): Promise<Job[]> => {
    return await prisma.$queryRaw`
    SELECT id, title, company, location, type, link, description, "createdAt", salary
    FROM "Job"
    WHERE title ILIKE ${`%${query}%`} OR company ILIKE ${`%${query}%`} OR location ILIKE ${`%${query}%`}
    LIMIT ${limit} OFFSET ${page * limit}
    ;`;
};

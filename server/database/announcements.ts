import { Announcement } from "@prisma/client";
import { prisma } from "./client";
import { DatabaseError } from "./utils";

export const queryAnnouncements = async (
  page: number
): Promise<Announcement[]> => {
  return await prisma.$queryRaw`
    SELECT a.id, a.title, left(a.content, 250) as content, a."publishDate"
    FROM "Announcement" a
    WHERE a.approved = true
    ORDER BY a."publishDate" DESC
    LIMIT 25 OFFSET ${page * 25};
    `;
};

export const getAnnouncementById = async (
  id: string
): Promise<Announcement | null> => {
  return await prisma.announcement.findUnique({
    where: {
      id,
    },
  });
};

export const addAnnouncementDB = async (
  id: string,
  title: string,
  content: string,
  imageURL: string | undefined,
  approved: boolean
): Promise<DatabaseError> => {
  try {
    await prisma.announcement.create({
      data: {
        id,
        title,
        content,
        imageURL,
        approved,
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const deleteAnnouncementById = async (
  id: string
): Promise<DatabaseError> => {
  try {
    const affected = (
      await prisma.announcement.deleteMany({
        where: {
          id,
        },
      })
    ).count;

    if (!affected)
      return DatabaseError.OPERATION_DEPENDS_ON_REQUIRED_RECORD_THAT_WAS_NOT_FOUND;
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

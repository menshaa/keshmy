import { DatabaseError } from "./utils";
import { Event } from "@prisma/client";
import { prisma } from "./client";

export const queryEvents = async (
  page: number,
  userId: string,
  limit = 25
): Promise<Event[]> => {
  return await prisma.$queryRaw`
    SELECT id, title, time, location, "imageURL", description,
    COUNT(i."userId")::INTEGER as interest,
    EXISTS (SELECT "userId" FROM "EventInterest" WHERE "userId" = ${userId} AND "eventId" = id) as "isInterested"
    FROM "Event"
    LEFT JOIN "EventInterest" i
    ON i."eventId" = id
    WHERE approved = true
    GROUP BY id
    ORDER BY time < now(), time ASC
    LIMIT ${limit} OFFSET ${25 * page}
    ;`;
};

export const querySidebarEvents = async (userId: string): Promise<Event[]> => {
  return await prisma.$queryRaw`
    SELECT id, title, time, location, "imageURL", description,
    COUNT(i."userId")::INTEGER as interest,
    EXISTS (SELECT "userId" FROM "EventInterest" WHERE "userId" = ${userId} AND "eventId" = id) as "isInterested"
    FROM "Event"
    LEFT JOIN "EventInterest" i
    ON i."eventId" = id
    WHERE approved = true AND time > now()
    GROUP BY id
    ORDER BY time < now(), time ASC
    LIMIT 3
    ;`;
};

export const addEventDB = async (
  id: string,
  title: string,
  description: string,
  location: string,
  time: Date,
  imageURL: string | undefined,
  approved: boolean
): Promise<DatabaseError> => {
  try {
    await prisma.event.create({
      data: {
        id,
        title,
        description,
        location,
        time,
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

export const toggleInterestDB = async (
  id: string,
  userId: string,
  interest: boolean
): Promise<DatabaseError> => {
  try {
    const event = await prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (new Date(event?.time ?? new Date()).getTime() <= new Date().getTime()) {
      return DatabaseError.EXPIRED;
    }

    if (interest) {
      await prisma.eventInterest.create({
        data: {
          eventId: id,
          userId,
        },
      });
    } else {
      await prisma.eventInterest.delete({
        where: {
          eventId_userId: {
            eventId: id,
            userId,
          },
        },
      });
    }
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const deleteEventDB = async (id: string): Promise<DatabaseError> => {
  try {
    const affected = (
      await prisma.event.deleteMany({
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

export const editEventDB = async (
  id: string,
  payload: any
): Promise<DatabaseError> => {
  try {
    await prisma.event.update({ where: { id }, data: payload });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

import { User, Event, Announcement, Article } from "@prisma/client";
import { prisma } from "./client";
import { DatabaseError } from "./utils";

export const queryAllUsers = async (page: number): Promise<Partial<User>[]> => {
  return await prisma.user.findMany({
    take: 25,
    skip: page * 25,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      surname: true,
      username: true,
      email: true,
      approved: true,
      restricted: true,
      createdAt: true,
      isAdmin: true,
    },
  });
};

export const queryAllPendingStudentAccounts = async (
  page: number
): Promise<Partial<User>[]> => {
  return await prisma.user.findMany({
    where: {
      isUnderGrad: true,
      approved: false,
    },
    take: 25,
    skip: page * 25,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      surname: true,
      username: true,
      email: true,
      approved: true,
      restricted: true,
      createdAt: true,
    },
  });
};

export const queryAllStaffAccounts = async (
  page: number
): Promise<Partial<User>[]> => {
  return await prisma.user.findMany({
    where: {
      OR: [
        {
          isAcademicStaff: true,
        },
        {
          isCafeteriaMan: true,
        },
      ],
    },
    take: 25,
    skip: page * 25,
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const queryAllEvents = async (
  page: number
): Promise<Partial<Event>[]> => {
  return await prisma.event.findMany({
    take: 25,
    skip: page * 25,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      time: true,
      location: true,
      approved: true,
      createdAt: true,
    },
  });
};

export const queryAllAnnouncements = async (
  page: number
): Promise<Partial<Announcement>[]> => {
  return await prisma.announcement.findMany({
    take: 25,
    skip: page * 25,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      approved: true,
      createdAt: true,
    },
  });
};

export const queryAllArticles = async (
  page: number
): Promise<Partial<Article & { author: Partial<User> }>[]> => {
  return await prisma.article.findMany({
    take: 25,
    skip: page * 25,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      approved: true,
      createdAt: true,
      author: {
        select: {
          name: true,
          surname: true,
          username: true,
        },
      },
    },
  });
};

export const approveUsersDB = async (ids: string[]): Promise<DatabaseError> => {
  try {
    await prisma.user.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        approved: true,
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const toggleAdmin = async (
  ids: string[],
  isAdmin: boolean
): Promise<DatabaseError> => {
  try {
    await prisma.user.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        isAdmin,
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};
export const toggleUserRestriction = async (
  ids: string[],
  restrict: boolean
): Promise<DatabaseError> => {
  try {
    await prisma.user.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        restricted: restrict,
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const approveEventsDB = async (
  ids: string[]
): Promise<DatabaseError> => {
  try {
    await prisma.event.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        approved: true,
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const approveAnnouncementsDB = async (
  ids: string[]
): Promise<DatabaseError> => {
  try {
    await prisma.announcement.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        approved: true,
        publishDate: new Date(),
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const approveArticlesDB = async (
  ids: string[]
): Promise<DatabaseError> => {
  try {
    await prisma.article.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        approved: true,
        publishDate: new Date(),
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const deleteUsersDB = async (ids: string[]): Promise<DatabaseError> => {
  try {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const deleteEventsDB = async (ids: string[]): Promise<DatabaseError> => {
  try {
    await prisma.event.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const deleteAnnouncementsDB = async (
  ids: string[]
): Promise<DatabaseError> => {
  try {
    await prisma.announcement.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const deleteArticlesDB = async (
  ids: string[]
): Promise<DatabaseError> => {
  try {
    await prisma.article.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

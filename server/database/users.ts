import { Prisma, User, UserSettings } from "@prisma/client";
import { prisma } from "./client";
import { DatabaseError } from "./utils";

interface UserFromReq {
  name: string;
  surname: string;
  username: string;
  email: string;
  password: string;
  approved?: boolean | undefined;
  isAcademicStaff?: boolean | undefined;
  isUnderGrad?: boolean | undefined;
  isCafeteriaMan?: boolean | undefined;
}

export const createUser = async (user: UserFromReq): Promise<DatabaseError> => {
  await prisma.user
    .create({
      data: {
        name: user.name,
        surname: user.surname,
        username: user.username,
        email: user.email,
        password: user.password,
        ...(user.isAcademicStaff !== undefined
          ? { isAcademicStaff: user.isAcademicStaff }
          : {}),
        ...(user.isUnderGrad !== undefined
          ? { isUnderGrad: user.isUnderGrad }
          : {}),
        ...(user.approved !== undefined ? { approved: user.approved } : {}),
        ...(user.isCafeteriaMan !== undefined
          ? { isCafeteriaMan: user.isCafeteriaMan }
          : {}),

        settings: {
          create: {},
        },
      },
    })
    .catch((err) => {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          // Unique constraint failed
          return DatabaseError.DUPLICATE;
        }
      }

      console.error(
        "Unknown error:",
        typeof err === "string" ? err : JSON.stringify(err)
      );
      return DatabaseError.UNKNOWN;
    });

  return DatabaseError.SUCCESS;
};

export const getUserByEmailOrUsername = async (
  usernameOrEmail: string
): Promise<(User & { settings: UserSettings | null }) | null> => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        {
          email: { equals: usernameOrEmail, mode: "insensitive" },
        },
        {
          username: { equals: usernameOrEmail, mode: "insensitive" },
        },
      ],
    },
    include: {
      settings: true,
    },
  });

  return user;
};

export const setUserResetToken = async (
  userId: string,
  token: string,
  expiration: Date
): Promise<DatabaseError> => {
  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        resetPasswordToken: token,
        resetPasswordTokenExpiry: expiration,
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const getUserByResetToken = async (
  token: string
): Promise<User | null> => {
  return await prisma.user.findFirst({
    where: {
      AND: [
        {
          resetPasswordToken: token,
        },
        {
          resetPasswordTokenExpiry: {
            gt: new Date(),
          },
        },
      ],
    },
  });
};

export const updateUserPassword = async (
  hash: string,
  token: string
): Promise<DatabaseError> => {
  try {
    const payload = await prisma.user.updateMany({
      where: {
        AND: [
          {
            resetPasswordToken: token,
          },
          {
            resetPasswordTokenExpiry: {
              gt: new Date(),
            },
          },
        ],
      },
      data: {
        resetPasswordTokenExpiry: null,
        password: hash,
        twoFactorAuth: false,
      },
    });

    if (!payload.count) {
      return DatabaseError.NOT_FOUND;
    }
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const getUserById = async (
  id: string
): Promise<(User & { settings: UserSettings | null }) | null> => {
  return await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      settings: true,
    },
  });
};

export const getUserByUsername = async (
  username: string
): Promise<(Partial<User> & { settings: UserSettings | null }) | null> => {
  const users = await prisma.user.findMany({
    where: {
      username: { equals: username, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      surname: true,
      username: true,
      email: true,
      avatarURL: true,
      approved: true,
      isUnderGrad: true,
      isAdmin: true,
      isAcademicStaff: true,
      isClubMember: true,
      settings: true,
    },
  });

  if (!users.length) return null;

  return users[0];
};

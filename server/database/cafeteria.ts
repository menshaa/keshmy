import { CafeteriaItem } from "@prisma/client";
import { prisma } from "./client";
import { DatabaseError } from "./utils";

export const addCafeteriaItem = async (
  name: string,
  price: number,
  imageURL: string | undefined
): Promise<DatabaseError> => {
  try {
    await prisma.cafeteriaItem.create({
      data: {
        name,
        price,
        imageURL,
      },
    });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const getCafeteriaItems = async (
  page: number
): Promise<CafeteriaItem[]> => {
  return await prisma.cafeteriaItem.findMany({
    take: 30,
    skip: page * 30,
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getNewCafeteriaItems = async (): Promise<CafeteriaItem[]> => {
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return await prisma.cafeteriaItem.findMany({
    where: {
      createdAt: {
        gt: last30Days,
      },
    },
    take: 4,
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const deleteItemDB = async (id: string): Promise<DatabaseError> => {
  try {
    const affected = (
      await prisma.cafeteriaItem.deleteMany({
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

export const editItemDB = async (
  id: string,
  payload: any
): Promise<DatabaseError> => {
  try {
    await prisma.cafeteriaItem.update({ where: { id }, data: payload });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

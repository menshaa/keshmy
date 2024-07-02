import { Job, JobType } from "@prisma/client";
import { prisma } from "./client";
import { DatabaseError } from "./utils";

export const queryJobs = async (
  page: number,
  type: string | undefined,
  location: boolean | undefined
): Promise<Job[]> => {
  const whereType =
    type == "undefined" ? {} : type !== "" ? { type: type as JobType } : {};
  const whereLocation =
    location === undefined
      ? {}
      : location
      ? { location: "Remote" }
      : { location: { not: "Remote" } };

  return await prisma.job.findMany({
    where: {
      ...whereType,
      ...whereLocation,
    },
    take: 25,
    skip: 25 * page,
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const addJobDB = async (
  title: string,
  description: string,
  company: string,
  location: string,
  type: JobType,
  salary: number[],
  link: string
): Promise<DatabaseError> => {
  try {
    await prisma.job.create({
      data: {
        title,
        description,
        company,
        location,
        type,
        salary,
        link,
      },
    });
  } catch (e) {
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

export const deleteJobDB = async (id: string): Promise<DatabaseError> => {
  try {
    const affected = (
      await prisma.job.deleteMany({
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

export const editJobDB = async (
  id: string,
  payload: any
): Promise<DatabaseError> => {
  try {
    await prisma.job.update({ where: { id }, data: payload });
  } catch (e) {
    console.error(e);
    return DatabaseError.UNKNOWN;
  }

  return DatabaseError.SUCCESS;
};

import { Request, Response } from "express";
import { AddJobData, GetJobsQuery } from "../validators/jobs";
import { addJobDB, deleteJobDB, queryJobs } from "../database/jobs";
import { DatabaseError } from "../database/utils";
import { GetDataById, GetPagedData } from "../validators/general";

export async function getJobs(req: Request, res: Response) {
    const data = GetPagedData.safeParse(req.params);
    const query = GetJobsQuery.safeParse(req.query);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    if (!query.success) {
        return res.status(400).json({ message: query.error.errors[0].message });
    }

    let isRemote: boolean | undefined = undefined;
    if (query.data.location === "Remote") {
        isRemote = true;
    } else if (query.data.location === "NotRemote") {
        isRemote = false;
    }

    const jobs = await queryJobs(data.data.page, query.data.type, isRemote);

    return res.status(200).json({ message: "Successfully fetched jobs", jobs });
}

export async function addJob(req: Request, res: Response) {
    const data = AddJobData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await addJobDB(data.data.title, data.data.description, data.data.company, data.data.location, data.data.type, data.data.salary, data.data.link);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error occurred while submitting this job" });
    }

    return res.status(201).json({ message: "Job added successfully" });
}

export async function deleteJob(req: Request, res: Response) {
    const data = GetDataById.safeParse(req.params);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await deleteJobDB(data.data.id);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error occurred while deleting this job" });
    } else if (error == DatabaseError.OPERATION_DEPENDS_ON_REQUIRED_RECORD_THAT_WAS_NOT_FOUND) {
        return res.status(404).json({ message: "Job not found" });
    }

    return res.status(200).json({ message: "Job deleted successfully" });
}

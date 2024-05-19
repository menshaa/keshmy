import z from "zod";

const JobType = z.enum(["FullTime", "PartTime", "Contract", "Internship"], {
    required_error: "Invalid job type",
});

const Location = z.enum(["Remote", "NotRemote"], {
    required_error: "Invalid location",
});

export const AddJobData = z.object({
    title: z.string().min(1, "Title cannot be empty"),
    description: z.string().min(1, "Description cannot be empty"),
    company: z.string().min(1, "Company cannot be empty"),
    location: z.string().min(1, "Location cannot be empty"),
    type: JobType,
    salary: z.preprocess((a) => {
        if (!Array.isArray(a)) return [];
        const sal = (a as string[]).map((i) => parseInt(i, 10));
        if (sal.some(isNaN)) return [];
        return sal;
    }, z.number().array().length(2, "Invalid salary")),
    link: z.string().min(1, "Link cannot be empty"),
});

export const GetJobsQuery = z.object({
    type: JobType.or(z.string()),
    location: Location.or(z.string()),
});

import z from "zod";

export const GetPagedData = z.object({
    page: z.preprocess(
        (a) => {
            const n = parseInt(a as string, 10);
            if (isNaN(n)) return -1;
            return n;
        },
        z.number().nonnegative("Invalid page number"),
    ),
});

export const GetDataById = z.object({
    id: z.string().min(1, "ID cannot be empty"),
});

export const AddArticleOrAnnouncementData = z.object({
    title: z.string().min(1, "Title cannot be empty"),
    content: z.string().min(1, "Content cannot be empty"),
});

import z from "zod";

export const CreateGroupData = z.object({
    name: z.string().min(1, "Name cannot be empty"),
    description: z.string().min(1, "Description cannot be empty"),
});

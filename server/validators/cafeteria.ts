import z from "zod";

export const AddItemData = z.object({
    name: z.string().min(1, "Name cannot be empty"),
    price: z.preprocess(
        (a) => {
            const n = parseInt(a as string, 10);
            if (isNaN(n)) return -1;
            return n;
        },
        z.number().nonnegative("Invalid price"),
    ),
});

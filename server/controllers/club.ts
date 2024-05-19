import { Request, Response } from "express";
import { queryPosts } from "../database/posts";
import { queryClubMembers } from "../database/club";
import { GetPagedData } from "../validators/general";

export async function getMembers(req: Request, res: Response) {
    const data = GetPagedData.safeParse(req.params);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const members = await queryClubMembers(data.data.page);

    return res.status(200).json({ message: "Successfully fetched club members", members });
}

export async function getPosts(req: Request, res: Response) {
    const data = GetPagedData.safeParse(req.params);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const posts = await queryPosts(req.session.user.id, data.data.page, "Club");

    return res.status(200).json({ message: "Successfully fetched club posts", posts });
}

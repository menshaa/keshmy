import { Request, Response } from "express";
import { addArticleDB, deleteArticleDB, getArticleById, queryArticles } from "../database/articles";
import { GetDataById, GetPagedData, AddArticleOrAnnouncementData } from "../validators/general";
import { DatabaseError } from "../database/utils";

export async function getArticles(req: Request, res: Response) {
    const data = GetPagedData.safeParse(req.query);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const page = data.data.page;

    const articles = await queryArticles(page);

    return res.status(200).json({ message: "Successfully fetched articles", articles });
}

export async function addArticle(req: Request, res: Response) {
    const data = AddArticleOrAnnouncementData.safeParse(req.body);

    if (!req.session.user.isAdmin && !req.session.user.isAcademicStaff) {
        return res.status(401).json({ message: "You are not authorized to perform this action" });
    }

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await addArticleDB(data.data.title, data.data.content, req.session.user.id);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error has occurred" });
    }

    return res.status(201).json({ message: "Your article has been submitted for approval" });
}

export async function getArticle(req: Request, res: Response) {
    const data = GetDataById.safeParse(req.params);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const article = (await getArticleById(data.data.id))[0];

    if (!article) {
        return res.status(404).json({ message: "Article doesn't exist" });
    }

    return res.status(200).json({ message: "Successfully fetched article", article });
}

export async function deleteArticle(req: Request, res: Response) {
    const data = GetDataById.safeParse(req.params);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await deleteArticleDB(data.data.id, req.session.user.id, req.session.user.isAdmin);

    switch (error) {
    case DatabaseError.OPERATION_DEPENDS_ON_REQUIRED_RECORD_THAT_WAS_NOT_FOUND:
        return res.status(404).json({ message: "Article not found" });
    case DatabaseError.NOT_AUTHORIZED:
        return res.status(401).json({ message: "Not authorized to perform this action" });
    case DatabaseError.UNKNOWN:
        return res.status(500).json({ message: "An internal error occurred while deleting the article" });
    }

    return res.status(200).json({ message: "Successfully deleted article" });
}

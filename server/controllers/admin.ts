import { Request, Response } from "express";
import { DeleteOrApproveData } from "../validators/admin";
import { GetPagedData } from "../validators/general";
import { approveAnnouncementsDB, approveArticlesDB, approveEventsDB, approveUsersDB, deleteAnnouncementsDB, deleteArticlesDB, deleteEventsDB, deleteUsersDB, queryAllAnnouncements, queryAllArticles, queryAllEvents, queryAllUsers, toggleUserRestriction } from "../database/admin";
import { prisma } from "../database/client";
import { DatabaseError } from "../database/utils";
import { traversalSafeRm } from "../utils";

export async function getAllUsers(req: Request, res: Response) {
    const data = GetPagedData.safeParse(req.query);

    if (!data.success) {
        return res.status(400).json({ message: "Invalid or missing page number" });
    }

    const page = data.data.page;
    
    const accountCount = await prisma.user.count();
    const accounts = await queryAllUsers(page);

    return res.status(200).json({
        message: "Retrieved users successfully",
        accounts,
        accountCount,
    });
}

export async function getAllEvents(req: Request, res: Response) {
    const data = GetPagedData.safeParse(req.query);

    if (!data.success) {
        return res.status(400).json({ message: "Invalid or missing page number" });
    }

    const page = data.data.page;
    
    const eventCount = await prisma.event.count();
    const events = await queryAllEvents(page);

    return res.status(200).json({
        message: "Retrieved events successfully",
        events,
        eventCount,
    });
}

export async function getAllAnnouncements(req: Request, res: Response) {
    const data = GetPagedData.safeParse(req.query);

    if (!data.success) {
        return res.status(400).json({ message: "Invalid or missing page number" });
    }

    const page = data.data.page;
    
    const announcementCount = await prisma.announcement.count();
    const announcements = await queryAllAnnouncements(page);

    return res.status(200).json({
        message: "Retrieved announcements successfully",
        announcements,
        announcementCount,
    });
}

export async function getAllArticles(req: Request, res: Response) {
    const data = GetPagedData.safeParse(req.query);

    if (!data.success) {
        return res.status(400).json({ message: "Invalid or missing page number" });
    }

    const page = data.data.page;
    
    const articleCount = await prisma.article.count();
    const articles = await queryAllArticles(page);

    return res.status(200).json({
        message: "Retrieved articles successfully",
        articles,
        articleCount,
    });
}

export async function approveUsers(req: Request, res: Response) {
    const data = DeleteOrApproveData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await approveUsersDB(data.data.ids);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error has occurred" });
    }

    return res.status(200).json({ message: `Successfully approved ${data.data.ids.length} users` });
}

export async function unrestrictUsers(req: Request, res: Response) {
    const data = DeleteOrApproveData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await toggleUserRestriction(data.data.ids, false);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error has occurred" });
    }

    return res.status(200).json({ message: `Successfully unrestricted ${data.data.ids.length} users` });
}

export async function restrictUsers(req: Request, res: Response) {
    const data = DeleteOrApproveData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await toggleUserRestriction(data.data.ids, true);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error has occurred" });
    }

    return res.status(200).json({ message: `Successfully restricted ${data.data.ids.length} users` });
}

export async function approveEvents(req: Request, res: Response) {
    const data = DeleteOrApproveData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await approveEventsDB(data.data.ids);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error has occurred" });
    }

    return res.status(200).json({ message: `Successfully approved ${data.data.ids.length} events` });
}

export async function approveAnnouncements(req: Request, res: Response) {
    const data = DeleteOrApproveData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await approveAnnouncementsDB(data.data.ids);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error has occurred" });
    }

    return res.status(200).json({ message: `Successfully approved ${data.data.ids.length} announcements` });
}

export async function approveArticles(req: Request, res: Response) {
    const data = DeleteOrApproveData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await approveArticlesDB(data.data.ids);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error has occurred" });
    }

    return res.status(200).json({ message: `Successfully approved ${data.data.ids.length} articles` });
}

export async function deleteUsers(req: Request, res: Response) {
    const data = DeleteOrApproveData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await deleteUsersDB(data.data.ids);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error has occurred" });
    }

    return res.status(200).json({ message: `Successfully deleted ${data.data.ids.length} users` });
}

export async function deleteEvents(req: Request, res: Response) {
    const data = DeleteOrApproveData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await deleteEventsDB(data.data.ids);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error has occurred" });
    }

    for (const eventId of data.data.ids) {
        await traversalSafeRm("events", eventId);
    }

    return res.status(200).json({ message: `Successfully deleted ${data.data.ids.length} events` });
}

export async function deleteAnnouncements(req: Request, res: Response) {
    const data = DeleteOrApproveData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await deleteAnnouncementsDB(data.data.ids);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error has occurred" });
    }

    return res.status(200).json({ message: `Successfully deleted ${data.data.ids.length} announcements` });
}

export async function deleteArticles(req: Request, res: Response) {
    const data = DeleteOrApproveData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await deleteArticlesDB(data.data.ids);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error has occurred" });
    }

    return res.status(200).json({ message: `Successfully deleted ${data.data.ids.length} articles` });
}

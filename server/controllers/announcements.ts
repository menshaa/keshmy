import { Request, Response } from "express";
import { addAnnouncementDB, deleteAnnouncementById, getAnnouncementById, queryAnnouncements } from "../database/announcements";
import { DatabaseError } from "../database/utils";
import { AddArticleOrAnnouncementData, GetDataById, GetPagedData } from "../validators/general";

export async function getAnnouncements(req: Request, res: Response) {
    const data = GetPagedData.safeParse(req.query);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const page = data.data.page;

    const announcements = await queryAnnouncements(page);

    return res.status(200).json({ message: "Successfully fetched announcements", announcements });
}

export async function getAnnouncement(req: Request, res: Response) {
    const data = GetDataById.safeParse(req.params);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const announcement = await getAnnouncementById(data.data.id);

    if (!announcement) {
        return res.status(404).json({ message: "Announcement doesn't exist" });
    }

    return res.status(200).json({ message: "Successfully fetched announcement", announcement });
}

export async function addAnnouncement(req: Request, res: Response) {
    const data = AddArticleOrAnnouncementData.safeParse(req.body);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await addAnnouncementDB(data.data.title, data.data.content);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error has occurred" });
    }

    return res.status(201).json({ message: "Your announcement has been submitted for approval" });
}

export async function deleteAnnouncement(req: Request, res: Response) {
    const data = GetDataById.safeParse(req.params);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const error = await deleteAnnouncementById(data.data.id);

    if (error === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error has occurred" });
    } else if (error === DatabaseError.OPERATION_DEPENDS_ON_REQUIRED_RECORD_THAT_WAS_NOT_FOUND) {
        return res.status(404).json({ message: "Announcement not found" });
    }

    return res.status(200).json({ message: "Successfully deleted announcement" });
}

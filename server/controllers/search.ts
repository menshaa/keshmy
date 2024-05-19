import { Request, Response } from "express";
import { SearchData } from "../validators/search";
import { searchArticles, searchEvents, searchJobs, searchUsers, searchAnnouncements } from "../database/search";

export async function doSearch(req: Request, res: Response) {
    const data = SearchData.safeParse(req.query);

    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    switch (data.data.type) {
    case "user": {
        const users = await searchUsers(data.data.query, data.data.page);
        return res.status(200).json({ message: "Successfully fetched search results", users });
    }
    case "announcement": {
        const announcements = await searchAnnouncements(data.data.query, data.data.page);
        return res.status(200).json({ message: "Successfully fetched search results", announcements });
    }
    case "article": {
        const articles = await searchArticles(data.data.query, data.data.page);
        return res.status(200).json({ message: "Successfully fetched search results", articles });
    }
    case "event": {
        const events = await searchEvents(data.data.query, req.session.user.id, data.data.page);
        return res.status(200).json({ message: "Successfully fetched search results", events });
    }
    case "job": {
        const jobs = await searchJobs(data.data.query, data.data.page);
        return res.status(200).json({ message: "Successfully fetched search results", jobs });
    }
    case "all":
    default: {
        const [users, announcements, articles, events, jobs] = await Promise.all([
            searchUsers(data.data.query, 0, 5),
            searchAnnouncements(data.data.query, 0, 5),
            searchArticles(data.data.query, 0, 5),
            searchEvents(data.data.query, req.session.user.id, 0, 5),
            searchJobs(data.data.query, 0, 5),
        ]);

        return res.status(200).json({ message: "Successfully fetched search results", users, announcements, articles, events, jobs });
    }
    }
}

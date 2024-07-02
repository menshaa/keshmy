import { Request, Response } from "express";
import { SearchData } from "../validators/search";
import {
  searchArticles,
  searchEvents,
  searchJobs,
  searchUsers,
  searchAnnouncements,
  searchGroups,
} from "../database/search";

import { prisma } from "../database/client";

export async function doSearch(req: Request, res: Response) {
  const data = SearchData.safeParse(req.query);
  const userId = req.session.user.id;

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  switch (data.data.type) {
    case "user": {
      const users = await searchUsers(data.data.query, data.data.page);
      return res
        .status(200)
        .json({ message: "Successfully fetched search results", users });
    }
    case "announcement": {
      const announcements = await searchAnnouncements(
        data.data.query,
        data.data.page
      );
      return res.status(200).json({
        message: "Successfully fetched search results",
        announcements,
      });
    }
    case "article": {
      const articles = await searchArticles(data.data.query, data.data.page);
      return res
        .status(200)
        .json({ message: "Successfully fetched search results", articles });
    }
    case "event": {
      const events = await searchEvents(
        data.data.query,
        req.session.user.id,
        data.data.page
      );
      return res
        .status(200)
        .json({ message: "Successfully fetched search results", events });
    }
    case "job": {
      const jobs = await searchJobs(data.data.query, data.data.page);
      return res
        .status(200)
        .json({ message: "Successfully fetched search results", jobs });
    }
    case "group": {
      const joinedGroups = await prisma.groupMembers.findMany({
        where: {
          userId,
        },
      });

      const joinedGroupIds = joinedGroups.map(
        (joinedGroup: any) => joinedGroup.groupId
      );
      let groups = await searchGroups(data.data.query, data.data.page);
      groups = groups.map((group) => {
        return {
          ...group,
          isJoined:
            joinedGroupIds.includes(group.id) || group.creatorId === userId,
        };
      });
      return res
        .status(200)
        .json({ message: "Successfully fetched search results", groups });
    }
    case "all":
    default: {
      const [users, announcements, articles, events, jobs, groups] =
        await Promise.all([
          searchUsers(data.data.query, 0, 5),
          searchAnnouncements(data.data.query, 0, 5),
          searchArticles(data.data.query, 0, 5),
          searchEvents(data.data.query, req.session.user.id, 0, 5),
          searchJobs(data.data.query, 0, 5),
          searchGroups(data.data.query, 0, 5),
        ]);

      const joinedGroups = await prisma.groupMembers.findMany({
        where: {
          userId,
        },
      });

      const joinedGroupIds = joinedGroups.map(
        (joinedGroup: any) => joinedGroup.groupId
      );

      const updatedGoups = groups.map((group) => {
        return {
          ...group,
          isJoined:
            joinedGroupIds.includes(group.id) || group.creatorId === userId,
        };
      });

      return res.status(200).json({
        message: "Successfully fetched search results",
        users,
        announcements,
        articles,
        events,
        jobs,
        groups: updatedGoups,
      });
    }
  }
}

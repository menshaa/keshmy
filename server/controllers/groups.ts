import { Request, Response } from "express";
import { CreateGroupData } from "../validators/groups";
import { snowflake } from "../database/snowflake";
import {
    createGroupDB,
    getGroupByIdDB,
    getGroupDB,
    getGroupsDB,
    getMyGroupsDB,
    joinGroupDB,
} from "../database/groups";
import { DatabaseError } from "../database/utils";

export async function createGroup(req: Request, res: Response) {
    const data = CreateGroupData.safeParse(req.body);
    if (!data.success) {
        return res.status(400).json({ message: data.error.errors[0].message });
    }

    const id = snowflake.getUniqueID();
    const userId = req.session.user.id;
    const response = await createGroupDB(
        id.toString(),
        data.data.name,
        data.data.description,
        userId,
    );

    if (response === DatabaseError.UNKNOWN) {
        return res.status(500).json({ message: "An internal error has occurred" });
    }

    return res.status(201).json({ message: "Group has been created" });
}
export async function joinGroup(req: Request, res: Response) {
    const userId = req.session.user.id;
    const groupId = req.params.id;

    const targetGroup = await getGroupByIdDB(groupId);
    if (!targetGroup) {
        return res.status(404).json({ message: "Group not found." });
    }

    const id = snowflake.getUniqueID();
    await joinGroupDB(id.toString(), userId, groupId);
    return res.status(201).json({ message: "Group joined successfully" });
}
export async function getGroups(req: Request, res: Response) {
    const userId = req.session.user.id;
    const groups = await getGroupsDB(userId);
    return res.status(200).json({ message: "Successfully fetched groups", groups });
}
export async function getMyGroups(req: Request, res: Response) {
    const userId = req.session.user.id;
    const groups = await getMyGroupsDB(userId);
    return res.status(200).json({ message: "Successfully fetched groups", groups });
}

export async function getGroup(req: Request, res: Response) {
    const groupId = req.params.id;
    const group = await getGroupDB(groupId);
    return res.status(200).json({ message: "Successfully fetched group", group });
}

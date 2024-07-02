import { Request, Response } from "express";
import {
  addAnnouncementDB,
  deleteAnnouncementById,
  editAnnouncementById,
  getAnnouncementById,
  queryAnnouncements,
} from "../database/announcements";
import { DatabaseError } from "../database/utils";
import {
  AddArticleOrAnnouncementData,
  GetDataById,
  GetPagedData,
} from "../validators/general";
import { UploadedFile } from "express-fileupload";
import fs from "fs/promises";
import { snowflake } from "../database/snowflake";

export async function getAnnouncements(req: Request, res: Response) {
  const data = GetPagedData.safeParse(req.query);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  const page = data.data.page;

  const announcements = await queryAnnouncements(page);

  return res
    .status(200)
    .json({ message: "Successfully fetched announcements", announcements });
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

  return res
    .status(200)
    .json({ message: "Successfully fetched announcement", announcement });
}

export async function addAnnouncement(req: Request, res: Response) {
  const isUserAdmin = req.session.user.isAdmin;
  const data = AddArticleOrAnnouncementData.safeParse(req.body);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  let imageURL: string | undefined = undefined;
  let imagePath: string | undefined = undefined;

  const id = snowflake.getUniqueID();

  if (req.files?.image) {
    const file = <UploadedFile>req.files.image;

    const fileName = "announcement";
    const dir = `${__dirname}/../cdn/announcements/${id}`;

    const ext = file.mimetype.split("/").at(-1);
    await fs.mkdir(dir, { recursive: true });
    await file.mv(`${dir}/${fileName}.${ext}`);

    imageURL = `http://${req.headers.host}/cdn/announcements/${id}/${fileName}.${ext}`;
    imagePath = `${dir}/${fileName}.${ext}`;
  }

  const error = await addAnnouncementDB(
    id.toString(),
    data.data.title,
    data.data.content,
    imageURL,
    isUserAdmin
  );

  if (error === DatabaseError.UNKNOWN) {
    return res.status(500).json({ message: "An internal error has occurred" });
  }

  return res
    .status(201)
    .json({ message: "Your announcement has been submitted for approval" });
}

export async function deleteAnnouncement(req: Request, res: Response) {
  const data = GetDataById.safeParse(req.params);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  const error = await deleteAnnouncementById(data.data.id);

  if (error === DatabaseError.UNKNOWN) {
    return res.status(500).json({ message: "An internal error has occurred" });
  } else if (
    error ===
    DatabaseError.OPERATION_DEPENDS_ON_REQUIRED_RECORD_THAT_WAS_NOT_FOUND
  ) {
    return res.status(404).json({ message: "Announcement not found" });
  }

  return res.status(200).json({ message: "Successfully deleted announcement" });
}

export async function editAnnouncement(req: Request, res: Response) {
  const data = GetDataById.safeParse(req.params);
  const payload = req.body;

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  const error = await editAnnouncementById(data.data.id, payload);

  if (error === DatabaseError.UNKNOWN) {
    return res
      .status(500)
      .json({ message: "An internal error occurred while editing this announcement" });
  }

  return res.status(200).json({ message: "Successfully updated announcement" });
}

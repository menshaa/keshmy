import { Request, Response } from "express";
import { AddEventData, ToggleInterestData } from "../validators/events";
import {
  addEventDB,
  deleteEventDB,
  editEventDB,
  queryEvents,
  querySidebarEvents,
  toggleInterestDB,
} from "../database/events";
import { DatabaseError } from "../database/utils";
import { GetDataById, GetPagedData } from "../validators/general";
import { UploadedFile } from "express-fileupload";
import fs from "fs/promises";
import { snowflake } from "../database/snowflake";

export async function getEvents(req: Request, res: Response) {
  const data = GetPagedData.safeParse(req.query);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  const events = await queryEvents(data.data.page, req.session.user.id);

  return res
    .status(200)
    .json({ message: "Successfully fetched events", events });
}

export async function getSidebarEvents(req: Request, res: Response) {
  const events = await querySidebarEvents(req.session.user.id);

  return res
    .status(200)
    .json({ message: "Successfully, fetched events", events });
}

export async function addEvent(req: Request, res: Response) {
  const isUserAdmin = req.session.user.isAdmin;
  const data = AddEventData.safeParse(req.body);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  let imageURL: string | undefined = undefined;
  let imagePath: string | undefined = undefined;

  const id = snowflake.getUniqueID();

  if (req.files?.image) {
    const file = <UploadedFile>req.files.image;

    const fileName = "event";
    const dir = `${__dirname}/../cdn/events/${id}`;

    const ext = file.mimetype.split("/").at(-1);
    await fs.mkdir(dir, { recursive: true });
    await file.mv(`${dir}/${fileName}.${ext}`);

    imageURL = `http://${req.headers.host}/cdn/events/${id}/${fileName}.${ext}`;
    imagePath = `${dir}/${fileName}.${ext}`;
  }

  const error = await addEventDB(
    id.toString(),
    data.data.title,
    data.data.description,
    data.data.location,
    data.data.time,
    imageURL,
    isUserAdmin
  );

  if (error === DatabaseError.UNKNOWN) {
    if (imagePath) {
      await fs.rm(imagePath);
    }
    return res.status(500).json({ message: "An internal error has occurred" });
  }

  return res
    .status(201)
    .json({ message: "Your event has been submitted for approval" });
}

export async function toggleInterest(req: Request, res: Response) {
  const data = GetDataById.safeParse(req.params);
  const body = ToggleInterestData.safeParse(req.body);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  if (!body.success) {
    return res.status(400).json({ message: body.error.errors[0].message });
  }

  const error = await toggleInterestDB(
    data.data.id,
    req.session.user.id,
    body.data.interest
  );

  if (error === DatabaseError.UNKNOWN) {
    return res.status(500).json({ message: "An internal error has occurred" });
  } else if (error === DatabaseError.EXPIRED) {
    return res
      .status(401)
      .json({ message: "Cannot change interest on an expired event" });
  }

  return res
    .status(200)
    .json({ message: "Successfully toggled interest in event" });
}

export async function editEvent(req: Request, res: Response) {
  const { id } = req.params;
  const payload = req.body;

  const error = await editEventDB(id, payload);

  if (error === DatabaseError.UNKNOWN) {
    return res
      .status(500)
      .json({ message: "An internal error occurred while editing this event" });
  }

  return res.status(200).json({ message: "Event updated successfully" });
}

export async function deleteEvent(req: Request, res: Response) {
  const { id } = req.params;

  const error = await deleteEventDB(id);

  if (error === DatabaseError.UNKNOWN) {
    return res.status(500).json({
      message: "An internal error occurred while deleting this event",
    });
  } else if (
    error ==
    DatabaseError.OPERATION_DEPENDS_ON_REQUIRED_RECORD_THAT_WAS_NOT_FOUND
  ) {
    return res.status(404).json({ message: "Event not found" });
  }

  return res.status(200).json({ message: "Event deleted successfully" });
}

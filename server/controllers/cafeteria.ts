import { Request, Response } from "express";
import { GetPagedData } from "../validators/general";
import {
  addCafeteriaItem,
  deleteItemDB,
  editItemDB,
  getCafeteriaItems,
  getNewCafeteriaItems,
} from "../database/cafeteria";
import { DatabaseError } from "../database/utils";
import { AddItemData } from "../validators/cafeteria";
import { UploadedFile } from "express-fileupload";
import fs from "fs/promises";
import crypto from "crypto";

export async function addItem(req: Request, res: Response) {
  const data = AddItemData.safeParse(req.body);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  let imageURL: string | undefined = undefined;
  let imagePath: string | undefined = undefined;

  if (req.files?.image) {
    const file = <UploadedFile>req.files.image;

    const bytes = crypto.randomBytes(8).toString("hex");
    const fileName = `${encodeURIComponent(data.data.name)}-${bytes}`;
    const dir = `${__dirname}/../cdn/cafeteria`;

    const ext = file.mimetype.split("/").at(-1);
    await fs.mkdir(dir, { recursive: true });
    await file.mv(`${dir}/${fileName}.${ext}`);

    imageURL = `http://${req.headers.host}/cdn/cafeteria/${fileName}.${ext}`;
    imagePath = `${dir}/${fileName}.${ext}`;
  }

  const error = await addCafeteriaItem(
    data.data.name,
    data.data.price,
    imageURL
  );

  if (error === DatabaseError.UNKNOWN) {
    if (imagePath) {
      await fs.rm(imagePath);
    }
    return res
      .status(500)
      .json({ message: "An internal error occurred while adding this item" });
  }

  return res.status(201).json({ message: "Item added successfully" });
}

export async function getItems(req: Request, res: Response) {
  const data = GetPagedData.safeParse(req.params);

  if (!data.success) {
    return res.status(400).json({ message: data.error.errors[0].message });
  }

  const items = await getCafeteriaItems(data.data.page);

  return res
    .status(200)
    .json({ message: "Successfully fetched cafeteria items", items });
}

export async function getSidebarItems(_: Request, res: Response) {
  const items = await getNewCafeteriaItems();

  return res
    .status(200)
    .json({ message: "Successfully fetched new cafeteria items", items });
}

export async function editItem(req: Request, res: Response) {
  const { id } = req.params;
  const payload = req.body;

  const error = await editItemDB(id, payload);

  if (error === DatabaseError.UNKNOWN) {
    return res
      .status(500)
      .json({ message: "An internal error occurred while editing this item" });
  }

  return res
    .status(200)
    .json({ message: "Cafeteria item updated successfully" });
}

export async function deleteItem(req: Request, res: Response) {
  const { id } = req.params;

  const error = await deleteItemDB(id);

  if (error === DatabaseError.UNKNOWN) {
    return res
      .status(500)
      .json({ message: "An internal error occurred while deleting this item" });
  } else if (
    error ==
    DatabaseError.OPERATION_DEPENDS_ON_REQUIRED_RECORD_THAT_WAS_NOT_FOUND
  ) {
    return res.status(404).json({ message: "Item not found" });
  }

  return res
    .status(200)
    .json({ message: "Cafeteria item deleted successfully" });
}

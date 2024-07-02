import express from "express";
import {
  addAnnouncement,
  getAnnouncements,
  getAnnouncement,
  deleteAnnouncement,
  editAnnouncement,
} from "../controllers/announcements";
import { adminGuard, sessionGuard } from "../controllers/utils/middleware";
const router = express.Router();

router.get("/get-announcements", sessionGuard, getAnnouncements);
router.get("/get-announcement/:id", sessionGuard, getAnnouncement);

router.post("/add-announcement", adminGuard, addAnnouncement);

router.delete("/delete-announcement/:id", adminGuard, deleteAnnouncement);
router.patch("/edit-announcement/:id", adminGuard, editAnnouncement);

export default router;

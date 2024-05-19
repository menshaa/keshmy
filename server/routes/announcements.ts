import express from "express";
import { addAnnouncement, getAnnouncements, getAnnouncement, deleteAnnouncement } from "../controllers/announcements";
import { adminGuard, sessionGuard } from "../controllers/utils/middleware";
const router = express.Router();

router.get("/get-announcements", sessionGuard, getAnnouncements);
router.get("/get-announcement/:id", sessionGuard, getAnnouncement);

router.post("/add-announcement", adminGuard, addAnnouncement);

router.delete("/delete-announcement/:id", adminGuard, deleteAnnouncement);

export default router;

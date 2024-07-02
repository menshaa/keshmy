import express from "express";
import {
  getCafeteriaItemImage,
  getEventImage,
  getMessageImage,
  getPostImages,
  getProfileImage,
  getAnnouncementImage,
} from "../controllers/cdn";
const router = express.Router();

router.get("/profile-images/:userId/:fileName", getProfileImage);
router.get("/cafeteria/:fileName", getCafeteriaItemImage);
router.get("/events/:eventId/:fileName", getEventImage);
router.get("/posts/:postId/:fileName", getPostImages);
router.get("/messages/:conversationId/:fileName", getMessageImage);
router.get("/announcements/:announcementId/:fileName", getAnnouncementImage);

export default router;

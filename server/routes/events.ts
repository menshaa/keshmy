import express from "express";
import {
  addEvent,
  getEvents,
  getSidebarEvents,
  toggleInterest,
  deleteEvent,
  editEvent,
} from "../controllers/events";
import { sessionGuard, adminGuard } from "../controllers/utils/middleware";
const router = express.Router();

router.get("/get-events", sessionGuard, getEvents);
router.get("/get-sidebar-events", sessionGuard, getSidebarEvents);

router.post("/add-event", adminGuard, addEvent);

router.patch("/toggle-interest/:id", sessionGuard, toggleInterest);
router.delete("/delete-event/:id", adminGuard, deleteEvent);
router.patch("/edit-event/:id", adminGuard, editEvent);

export default router;

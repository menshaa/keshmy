import express from "express";
import { adminGuard } from "../controllers/utils/middleware";
import {
  getAllUsers,
  getAllEvents,
  getAllAnnouncements,
  getAllArticles,
  approveUsers,
  approveEvents,
  approveAnnouncements,
  approveArticles,
  deleteUsers,
  deleteEvents,
  deleteAnnouncements,
  deleteArticles,
  restrictUsers,
  unrestrictUsers,
  getAllPendingStudents,
  getAllStaffs,
  createStaff,
  addAdmin,
  removeAdmin,
} from "../controllers/admin";
const router = express.Router();

router.get("/get-all-users", adminGuard, getAllUsers);
router.get("/get-all-pending-students", adminGuard, getAllPendingStudents);
router.get("/get-all-staff-accounts", adminGuard, getAllStaffs);
router.post("/staff-account", adminGuard, createStaff);

router.get("/get-all-events", adminGuard, getAllEvents);
router.get("/get-all-announcements", adminGuard, getAllAnnouncements);
router.get("/get-all-articles", adminGuard, getAllArticles);

router.patch("/approve-users", adminGuard, approveUsers);
router.patch("/unrestrict-users", adminGuard, unrestrictUsers);
router.patch("/restrict-users", adminGuard, restrictUsers);
router.patch("/approve-events", adminGuard, approveEvents);
router.patch("/approve-announcements", adminGuard, approveAnnouncements);
router.patch("/approve-articles", adminGuard, approveArticles);

router.patch("/delete-users", adminGuard, deleteUsers);
router.patch("/delete-events", adminGuard, deleteEvents);
router.patch("/delete-announcements", adminGuard, deleteAnnouncements);
router.patch("/delete-articles", adminGuard, deleteArticles);

router.patch("/add-admin", adminGuard, addAdmin);
router.patch("/remove-admin", adminGuard, removeAdmin);

export default router;

import express from "express";
import {
  addItem,
  getItems,
  getSidebarItems,
  deleteItem,
  editItem,
} from "../controllers/cafeteria";
import { sessionGuard, adminGuard } from "../controllers/utils/middleware";
const router = express.Router();

router.get("/get-items/:page", sessionGuard, getItems);
router.get("/get-sidebar-items", sessionGuard, getSidebarItems);

router.post("/add-item", adminGuard, addItem);
router.delete("/delete-item/:id", adminGuard, deleteItem);
router.patch("/edit-item/:id", adminGuard, editItem);

export default router;

import express from "express";
import { addItem, getItems, getSidebarItems } from "../controllers/cafeteria";
import { sessionGuard, adminGuard } from "../controllers/utils/middleware";
const router = express.Router();

router.get("/get-items/:page", sessionGuard, getItems);
router.get("/get-sidebar-items", sessionGuard, getSidebarItems);

router.post("/add-item", adminGuard, addItem);

export default router;

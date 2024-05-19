import express from "express";
import { addArticle, getArticles, getArticle, deleteArticle } from "../controllers/articles";
import { sessionGuard } from "../controllers/utils/middleware";
const router = express.Router();

router.get("/get-articles", sessionGuard, getArticles);
router.get("/get-article/:id", sessionGuard, getArticle);

router.post("/add-article", sessionGuard, addArticle);

router.delete("/delete-article/:id", sessionGuard, deleteArticle);

export default router;

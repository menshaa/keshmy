import express from "express";
import { addJob, getJobs, deleteJob } from "../controllers/jobs";
import { sessionGuard, adminGuard } from "../controllers/utils/middleware";
const router = express.Router();

router.get("/get-jobs/:page", sessionGuard, getJobs);

router.post("/add-job", adminGuard, addJob);

router.delete("/delete-job/:id", adminGuard, deleteJob);

export default router;

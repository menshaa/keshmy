import express from "express";
import { addJob, getJobs, deleteJob, editJob } from "../controllers/jobs";
import { sessionGuard, adminGuard } from "../controllers/utils/middleware";
const router = express.Router();

router.get("/get-jobs/:page", sessionGuard, getJobs);

router.post("/add-job", adminGuard, addJob);

router.delete("/delete-job/:id", adminGuard, deleteJob);
router.patch("/edit-job/:id", adminGuard, editJob);

export default router;

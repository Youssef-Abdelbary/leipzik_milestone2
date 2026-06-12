import express from "express";

import {
  getActiveStaff,
  saveLayout,
  shareLayout,
  getSharedLayoutsForStaff,
} from "../controllers/layoutController.js";

const router = express.Router();

router.get("/staff", getActiveStaff);

router.post("/", saveLayout);

router.patch("/:layoutId/share", shareLayout);

router.get("/shared/:staffId", getSharedLayoutsForStaff);

export default router;
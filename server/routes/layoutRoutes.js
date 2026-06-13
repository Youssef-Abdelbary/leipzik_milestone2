import express from "express";

import {
  getActiveStaff,
  saveLayout,
  shareLayout,
  getSharedLayoutsForStaff,
  getLayoutByEvent,
} from "../controllers/layoutController.js";

const router = express.Router();

router.get("/staff", getActiveStaff);

router.post("/", saveLayout);

router.patch("/:layoutId/share", shareLayout);

router.get("/shared/:staffId", getSharedLayoutsForStaff);
router.get("/event/:eventId", getLayoutByEvent);

export default router;
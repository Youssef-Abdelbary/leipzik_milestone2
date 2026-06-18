import express from "express";

import {
  testBudgetRoute,
  getBudgetByEvent,
  updatePlannedBudget,
  createActualExpense,
  updateActualExpense,
} from "../controllers/controllerBudget.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authenticate);
router.use(requireRoles("organizer"));

router.get("/test", testBudgetRoute);
router.get("/event/:eventId", getBudgetByEvent);
router.patch("/event/:eventId/planned", updatePlannedBudget);
router.post("/event/:eventId/expenses", createActualExpense);
router.patch("/expenses/:expenseId", updateActualExpense);

export default router;

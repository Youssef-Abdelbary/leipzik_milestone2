import express from "express";

import {
  testBudgetRoute,
  getBudgetByEvent,
  updatePlannedBudget,
  createActualExpense,
  updateActualExpense,
} from "../controllers/controllerBudget.js";

const router = express.Router();

router.get("/test", testBudgetRoute);
router.get("/event/:eventId", getBudgetByEvent);
router.patch("/event/:eventId/planned", updatePlannedBudget);
router.post("/event/:eventId/expenses", createActualExpense);
router.patch("/expenses/:expenseId", updateActualExpense);
export default router;
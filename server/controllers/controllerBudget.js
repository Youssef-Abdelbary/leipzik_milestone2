import mongoose from "mongoose";
import { findOrganizerEvent, toObjectId } from "../utils/eventAccess.js";

export function testBudgetRoute(req, res) {
  res.json({
    message: "Budget route is working",
  });
}

export async function getBudgetByEvent(req, res) {
  try {
    const { eventId } = req.params;

    const expensesCollection = mongoose.connection.db.collection("expense_records");

    const eventObjectId = toObjectId(eventId);
    if (!eventObjectId) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await findOrganizerEvent(req.user.user_id, eventId);
    if (!event) {
      return res.status(404).json({
        message: "Event not found or access denied",
      });
    }

    const expenses = await expensesCollection
      .find({
        eventId: eventObjectId,
      })
      .sort({ createdAt: -1 })
      .toArray();

    

    const plannedTotal = Number(event.budget?.plannedTotal || 0);

    const actualTotal = expenses.reduce((total, expense) => {
      const amount = Number(
        expense.amount ||
        expense.totalAmount ||
        expense.cost ||
        expense.actualAmount ||
        0
      );

      return total + amount;
    }, 0);

    const plannedBreakdown = event.budget?.plannedBreakdown || [];

    const categoryComparison = plannedBreakdown.map((plannedItem) => {
    const actualAmountForCategory = expenses
        .filter((expense) => expense.category === plannedItem.category)
        .reduce((total, expense) => {
        return total + Number(expense.amount || 0);
        }, 0);

    return {
        category: plannedItem.category,
        plannedAmount: Number(plannedItem.plannedAmount || 0),
        actualAmount: actualAmountForCategory,
        difference:
        Number(plannedItem.plannedAmount || 0) - actualAmountForCategory,
    };
    });    

    res.json({
      eventId: event._id,
      eventTitle: event.title,
      currency: event.budget?.currency || "EGP",
      plannedTotal,
      plannedBreakdown: event.budget?.plannedBreakdown || [],
      actualExpenses: expenses,
      actualTotal,
      difference: plannedTotal - actualTotal,
      categoryComparison,
    });
  } catch (error) {
    console.error("Get budget by event error:", error);

    res.status(500).json({
      message: "Failed to load budget for this event",
      error: error.message,
    });
  }
}

export async function updatePlannedBudget(req, res) {
  try {
    const { eventId } = req.params;
    const { plannedTotal, plannedBreakdown, currency } = req.body;

    const eventsCollection = mongoose.connection.db.collection("events");

    const eventObjectId = toObjectId(eventId);
    if (!eventObjectId) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const ownedEvent = await findOrganizerEvent(req.user.user_id, eventId);
    if (!ownedEvent) {
      return res.status(404).json({ message: "Event not found or access denied" });
    }

    const updatedEvent = await eventsCollection.findOneAndUpdate(
      {
        _id: eventObjectId,
        organizerId: toObjectId(req.user.user_id),
      },
      {
        $set: {
          "budget.plannedTotal": Number(plannedTotal),
          "budget.currency": currency || "EGP",
          "budget.plannedBreakdown": plannedBreakdown,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!updatedEvent) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.json({
      message: "Planned budget updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Update planned budget error:", error);

    res.status(500).json({
      message: "Failed to update planned budget",
    });
  }
}

export async function createActualExpense(req, res) {
  try {
    const { eventId } = req.params;
    const { category, description, amount, currency, paymentDate } = req.body;

    if (!category || !description || amount === undefined) {
      return res.status(400).json({
        message: "Category, description, and amount are required",
      });
    }

    const expensesCollection = mongoose.connection.db.collection("expense_records");

    const eventObjectId = toObjectId(eventId);
    if (!eventObjectId) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await findOrganizerEvent(req.user.user_id, eventId);
    if (!event) {
      return res.status(404).json({
        message: "Event not found or access denied",
      });
    }

    const expense = {
      eventId: eventObjectId,
      organizerId: toObjectId(req.user.user_id),
      category,
      description,
      amount: Number(amount),
      currency: currency || event.budget?.currency || "EGP",
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      vendorRequestId: null,
      invoiceId: null,
      receiptUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await expensesCollection.insertOne(expense);

    res.status(201).json({
      message: "Actual expense created successfully",
      expense: {
        _id: result.insertedId,
        ...expense,
      },
    });
  } catch (error) {
    console.error("Create actual expense error:", error);

    res.status(500).json({
      message: "Failed to create actual expense",
    });
  }
}

export async function updateActualExpense(req, res) {
  try {
    const { expenseId } = req.params;
    const { category, description, amount, currency, paymentDate } = req.body;

    if (!category || !description || amount === undefined) {
      return res.status(400).json({
        message: "Category, description, and amount are required",
      });
    }

    const expensesCollection = mongoose.connection.db.collection("expense_records");

    const expenseObjectId = toObjectId(expenseId);
    if (!expenseObjectId) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const existingExpense = await expensesCollection.findOne({
      _id: expenseObjectId,
    });

    if (!existingExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const ownedEvent = await findOrganizerEvent(req.user.user_id, existingExpense.eventId);
    if (!ownedEvent) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updatedExpense = await expensesCollection.findOneAndUpdate(
      {
        _id: expenseObjectId,
      },
      {
        $set: {
          category,
          description,
          amount: Number(amount),
          currency: currency || "EGP",
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!updatedExpense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    res.json({
      message: "Actual expense updated successfully",
      expense: updatedExpense,
    });
  } catch (error) {
    console.error("Update actual expense error:", error);

    res.status(500).json({
      message: "Failed to update actual expense",
    });
  }
}
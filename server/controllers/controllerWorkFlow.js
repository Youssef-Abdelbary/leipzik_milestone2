import mongoose from "mongoose";
import { createNotification } from "../utils/notificationUtil.js";
import Notification from "../models/modelNotification.js";
import Feedback from "../models/modelFeedback.js";
import { computeEventFeedbackStats } from "../utils/feedbackStats.js";

export function testWorkflowRoute(req, res) {
  res.json({
    message: "Workflow route is working",
  });
}

export async function getUpcomingEvents(req, res) {
  try {
    const eventsCollection = mongoose.connection.db.collection("events");

    const events = await eventsCollection
      .find({
        organizerId: new mongoose.Types.ObjectId(req.params.organizerId),
      })
      .sort({ startDate: 1, eventDate: 1, date: 1 })
      .limit(20)
      .toArray();

    res.json(events);
  } catch (error) {
    console.error("Get upcoming events error:", error);

    res.status(500).json({
      message: "Failed to load upcoming events",
    });
  }
}

export async function getWorkflowSummary(req, res) {
  try {
    const eventsCollection = mongoose.connection.db.collection("events");
    const organizerObjectId = new mongoose.Types.ObjectId(req.params.organizerId);
    const today = new Date();

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const startOfTomorrow = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const todayEvents = await eventsCollection
      .find({
        organizerId: organizerObjectId,
        date: {
          $gte: startOfToday,
          $lt: startOfTomorrow,
        },
      })
      .toArray();

    const upcomingEvents = await eventsCollection
      .find({
        organizerId: organizerObjectId,
        date: {
          $gte: startOfToday,
        },
      })
      .toArray();

    const allOrganizerEvents = await eventsCollection
      .find({ organizerId: organizerObjectId })
      .project({ _id: 1 })
      .toArray();

    const allEventIds = allOrganizerEvents.map((event) => event._id);

    const submittedFeedbacks = allEventIds.length
      ? await Feedback.find({
          eventId: { $in: allEventIds },
          submittedAt: { $ne: null },
        }).lean()
      : [];

    const feedbackSummary = computeEventFeedbackStats(submittedFeedbacks);

    res.json({
      todayEventsCount: todayEvents.length,
      upcomingEventsCount: upcomingEvents.length,
      averagePositiveFeedback: feedbackSummary.averagePositiveFeedback,
      averageNegativeFeedback: feedbackSummary.averageNegativeFeedback,
      positiveFeedbackCount: feedbackSummary.positiveCount,
      negativeFeedbackCount: feedbackSummary.negativeCount,
      totalFeedbackCount: feedbackSummary.totalCount,
    });
  } catch (error) {
    console.error("Get workflow summary error:", error);

    res.status(500).json({
      message: "Failed to load workflow summary",
    });
  }
}

export async function getWorkflowTasks(req, res) {
  try {
    const tasksCollection = mongoose.connection.db.collection("event_tasks");

    const tasks = await tasksCollection
      .find({
        organizerId: new mongoose.Types.ObjectId(req.params.organizerId),
     })
      .sort({ dueDate: 1 })
      .limit(30)
      .toArray();

    res.json(tasks);
  } catch (error) {
    console.error("Get workflow tasks error:", error);

    res.status(500).json({
      message: "Failed to load workflow tasks",
    });
  }
}

export async function createTaskReminderNotifications(req, res) {
  try {
    const tasksCollection = mongoose.connection.db.collection("event_tasks");

    const now = new Date();
    const isTestMode = req.query.test === "true";

    let tasks;

    if (isTestMode) {
      tasks = await tasksCollection
        .find({
          status: { $ne: "done" },
        })
        .toArray();
    } else {
      tasks = await tasksCollection
        .find({
          status: { $ne: "done" },
          reminderAt: { $lte: now },
        })
        .toArray();
    }

    let createdCount = 0;

    for (const task of tasks) {
      const reminderUserId = task.organizerId || task.assignedTo;

      if (!reminderUserId) {
        continue;
      }

      const existingNotification = await Notification.findOne({
        type: "task_reminder",
        relatedEntityType: "event_task",
        relatedEntityId: task._id,
        userId: reminderUserId,
      });

      if (existingNotification) {
        continue;
      }

      const notification = await createNotification({
        userId: reminderUserId,
        type: "task_reminder",
        title: "Task reminder",
        message: `${task.title} is due soon.`,
        relatedEntityType: "event_task",
        relatedEntityId: task._id,
        scheduledFor: task.reminderAt || task.dueDate,
      });

      if (notification) {
        createdCount++;
      }
    }

    res.json({
      message: "Task reminder notifications created",
      createdCount,
    });
  } catch (error) {
    console.error("Create task reminders error:", error);

    res.status(500).json({
      message: "Failed to create task reminder notifications",
    });
  }
}

export async function getWorkflowNotifications(req, res) {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({
      userId,
      type: "task_reminder",
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(notifications);
  } catch (error) {
    console.error("Get workflow notifications error:", error);

    res.status(500).json({
      message: "Failed to load workflow notifications",
    });
  }
}

export async function markNotificationAsRead(req, res) {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { status: "read" },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);

    res.status(500).json({
      message: "Failed to mark notification as read",
    });
  }
}
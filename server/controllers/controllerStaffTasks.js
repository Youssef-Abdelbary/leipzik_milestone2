import mongoose from "mongoose";

export function testStaffTasksRoute(req, res) {
  res.json({ message: "Staff tasks route is working" });
}

export async function getStaffEvents(req, res) {
  try {
    const { staffId } = req.params;
    const { date } = req.query;

    const tasksCollection = mongoose.connection.db.collection("event_tasks");
    const eventsCollection = mongoose.connection.db.collection("events");

    const staffObjectId = new mongoose.Types.ObjectId(staffId);

    const assignedTasks = await tasksCollection
      .find({
        assignedTo: staffObjectId,
      })
      .toArray();

    const eventIds = [
      ...new Set(assignedTasks.map((task) => String(task.eventId))),
    ].map((id) => new mongoose.Types.ObjectId(id));

    if (eventIds.length === 0) {
      return res.json([]);
    }

    const eventQuery = {
      _id: { $in: eventIds },
    };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      eventQuery.date = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    const events = await eventsCollection
      .find(eventQuery)
      .sort({ date: 1 })
      .toArray();

    res.json(events);
  } catch (error) {
    console.error("Get staff events error:", error);
    res.status(500).json({ message: "Failed to get staff events" });
  }
}

export async function getStaffAssignedTasks(req, res) {
  try {
    const { staffId } = req.params;
    const { status, eventId } = req.query;

    const tasksCollection = mongoose.connection.db.collection("event_tasks");
    const eventsCollection = mongoose.connection.db.collection("events");

    const query = {
      assignedTo: new mongoose.Types.ObjectId(staffId),
    };

    if (status) {
      query.status = status;
    }

    if (eventId) {
      query.eventId = new mongoose.Types.ObjectId(eventId);
    }

    const tasks = await tasksCollection
      .find(query)
      .sort({ dueDate: 1 })
      .toArray();

    const tasksWithEventNames = await Promise.all(
      tasks.map(async (task) => {
        const event = await eventsCollection.findOne({
          _id: task.eventId,
        });

        return {
          ...task,
          eventTitle: event?.title || "Unknown event",
          eventDate: event?.date || null,
        };
      })
    );

    res.json(tasksWithEventNames);
  } catch (error) {
    console.error("Get staff assigned tasks error:", error);
    res.status(500).json({ message: "Failed to get assigned tasks" });
  }
}

export async function updateTaskProgress(req, res) {
  try {
    const { taskId } = req.params;
    const { status, progressPercent } = req.body;

    const allowedStatuses = ["pending", "in_progress", "done"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status must be pending, in_progress, or done",
      });
    }

    if (
      progressPercent === undefined ||
      progressPercent < 0 ||
      progressPercent > 100
    ) {
      return res.status(400).json({
        message: "Progress percent must be between 0 and 100",
      });
    }

    const tasksCollection = mongoose.connection.db.collection("event_tasks");

    const updateData = {
      status,
      progressPercent: Number(progressPercent),
      updatedAt: new Date(),
    };

    if (status === "done") {
      updateData.completedAt = new Date();
      updateData.progressPercent = 100;
    }

    if (status !== "done") {
      updateData.completedAt = null;
    }

    const updatedTask = await tasksCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(taskId) },
      {
        $set: updateData,
      },
      { returnDocument: "after" }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({
      message: "Task progress updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task progress error:", error);
    res.status(500).json({ message: "Failed to update task progress" });
  }
}
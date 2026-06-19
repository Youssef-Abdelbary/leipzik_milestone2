import mongoose from "mongoose";
import EventLayout from "../models/EventLayout.js";
import { findOrganizerEvent, toObjectId } from "../utils/eventAccess.js";
export function testTeamRoute(req, res) {
  res.json({ message: "Team route is working" });
}

export async function getStaffMembers(req, res) {
  try {
    const { employmentType, speciality } = req.query;

    const usersCollection = mongoose.connection.db.collection("users");
    const staffProfilesCollection = mongoose.connection.db.collection("staff_profiles");

    const staffUsers = await usersCollection
      .find({
        role: "staff",
        status: "active",
      })
      .toArray();

    const staffWithProfiles = await Promise.all(
      staffUsers.map(async (staffUser) => {
        const staffProfile = await staffProfilesCollection.findOne({
          userId: staffUser._id,
        });

        return {
          _id: staffUser._id,
          fullName: staffUser.fullname,
          fullname: staffUser.fullname,
          email: staffUser.email,
          phone: staffUser.phone,
          employmentType: staffProfile?.employmentType || "Not specified",
          speciality: staffProfile?.speciality || "Not specified",
          age: staffProfile?.age || "Not specified",
          experienceYears: staffProfile?.experienceYears || 0,
        };
      })
    );

    let filteredStaff = staffWithProfiles;

    if (employmentType) {
      filteredStaff = filteredStaff.filter(
        (staff) => staff.employmentType === employmentType
      );
    }

    if (speciality) {
      filteredStaff = filteredStaff.filter(
        (staff) => staff.speciality === speciality
      );
    }

    res.json(filteredStaff);
  } catch (error) {
    console.error("Get staff members error:", error);
    res.status(500).json({ message: "Failed to get staff members" });
  }
}

export async function getEventTasks(req, res) {
  try {
    const { eventId } = req.params;
    const { status } = req.query;

    const ownedEvent = await findOrganizerEvent(req.user.user_id, eventId);
    if (!ownedEvent) {
      return res.status(404).json({ message: "Event not found or access denied" });
    }

    const tasksCollection = mongoose.connection.db.collection("event_tasks");

    const query = {
      eventId: new mongoose.Types.ObjectId(eventId),
    };

    if (status) {
      query.status = status;
    }

    const tasks = await tasksCollection
      .find(query)
      .sort({ dueDate: 1 })
      .toArray();

    res.json(tasks);
  } catch (error) {
    console.error("Get event tasks error:", error);
    res.status(500).json({ message: "Failed to get event tasks" });
  }
}

async function syncEventLayoutSharedStaff(eventId) {
  if (!eventId) {
    return;
  }

  const tasksCollection = mongoose.connection.db.collection("event_tasks");

  const eventTasks = await tasksCollection
    .find({
      eventId: new mongoose.Types.ObjectId(eventId),
      assignedTo: { $ne: null },
    })
    .toArray();

  const staffIds = [
    ...new Set(
      eventTasks
        .filter((task) => task.assignedTo)
        .map((task) => String(task.assignedTo))
    ),
  ];

  await EventLayout.updateMany(
    { eventId: new mongoose.Types.ObjectId(eventId) },
    {
      $set: {
        sharedWithStaff: staffIds,
      },
    }
  );
}

export async function assignTaskToStaff(req, res) {
  try {
    const { taskId } = req.params;
    const { staffId } = req.body;

    if (!staffId) {
      return res.status(400).json({ message: "Staff ID is required" });
    }

    const tasksCollection = mongoose.connection.db.collection("event_tasks");

    const existingTask = await tasksCollection.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
    });

    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    const ownedEvent = await findOrganizerEvent(req.user.user_id, existingTask.eventId);
    if (!ownedEvent) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (existingTask.status === "done") {
      return res.status(400).json({
        message: "Completed tasks cannot be reassigned",
      });
    }

    const updatedTask = await tasksCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(taskId) },
      {
        $set: {
          assignedTo: new mongoose.Types.ObjectId(staffId),
          status: "pending",
          progressPercent: 0,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    await syncEventLayoutSharedStaff(existingTask.eventId);

    res.json({
      message: "Task assigned successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Assign task error:", error);
    res.status(500).json({ message: "Failed to assign task" });
  }
}

export async function createEventTask(req, res) {
  try {
    const { eventId } = req.params;
    const { title, description, category, priority, dueDate } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        message: "Title, description, and category are required",
      });
    }

    const tasksCollection = mongoose.connection.db.collection("event_tasks");

    const event = await findOrganizerEvent(req.user.user_id, eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found or access denied" });
    }

    const newTask = {
      eventId: toObjectId(eventId),
      organizerId: toObjectId(req.user.user_id),
      assignedTo: null,
      title,
      description,
      category,
      status: "not_assigned",
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      progressPercent: 0,
      reminderAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await tasksCollection.insertOne(newTask);

    res.status(201).json({
      message: "Task created successfully",
      task: {
        _id: result.insertedId,
        ...newTask,
      },
    });
  } catch (error) {
    console.error("Create event task error:", error);
    res.status(500).json({ message: "Failed to create event task" });
  }
}
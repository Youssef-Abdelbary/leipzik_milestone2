import mongoose from "mongoose";
import Guest from "../models/modelGuest.js";
import Event from "../models/modelEvent.js";
import { canManageEventGuests } from "../utils/eventAccess.js";

export const getGuests = async (req, res) => {
  try {
    const organizerEvents = await Event.find({
      organizerId: req.user.user_id,
    })
      .select("_id")
      .lean();

    const eventIds = organizerEvents.map((event) => event._id);

    if (eventIds.length === 0) {
      return res.json({ data: [] });
    }

    const guestsWithEvents = await Guest.find({
      eventId: { $in: eventIds },
    })
      .populate("eventId", "title")
      .lean();

    res.json({ data: guestsWithEvents });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch guests." });
  }
};

export const getGuestsForStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    const tasksCollection = mongoose.connection.db.collection("event_tasks");

    const assignedTasks = await tasksCollection
      .find({
        assignedTo: new mongoose.Types.ObjectId(staffId),
      })
      .toArray();

    const eventIds = [
      ...new Set(
        assignedTasks
          .filter((task) => task.eventId)
          .map((task) => String(task.eventId))
      ),
    ].map((id) => new mongoose.Types.ObjectId(id));

    if (eventIds.length === 0) {
      return res.json({ data: [] });
    }

    const guestsWithEvents = await Guest.find({
      eventId: { $in: eventIds },
    })
      .populate("eventId", "title")
      .lean();

    res.json({ data: guestsWithEvents });
  } catch (err) {
    console.error("Failed to fetch staff guests:", err);
    res.status(500).json({ message: "Failed to fetch staff guests." });
  }
};

export const getGuestsForStaffEvent = async (req, res) => {
  try {
    const { staffId, eventId } = req.params;

    const tasksCollection = mongoose.connection.db.collection("event_tasks");

    const staffHasTaskInEvent = await tasksCollection.findOne({
      assignedTo: new mongoose.Types.ObjectId(staffId),
      eventId: new mongoose.Types.ObjectId(eventId),
    });

    if (!staffHasTaskInEvent) {
      return res.status(403).json({
        message: "You do not have access to this event's guests.",
      });
    }

    const guestsWithEvents = await Guest.find({
      eventId: new mongoose.Types.ObjectId(eventId),
    })
      .populate("eventId", "title")
      .lean();

    res.json({ data: guestsWithEvents });
  } catch (err) {
    console.error("Failed to fetch staff event guests:", err);
    res.status(500).json({ message: "Failed to fetch event guests." });
  }
};

export const updateGuestCheckIn = async (req, res) => {
    try {
        const guestId = req.params.id;
        const { status, method } = req.body;

        const guest = await Guest.findById(guestId).lean();
        if (!guest) {
            return res.status(404).json({ message: "Guest not found." });
        }

        const allowed = await canManageEventGuests(
            req.user.user_id,
            req.user.role,
            guest.eventId
        );

        if (!allowed) {
            return res.status(403).json({ message: "Access denied." });
        }

        const updateFields = {};
        
        if (status === "Arrived") {
            updateFields.$set = {
                "checkIn.status": "Arrived",
                "checkIn.method": method,
                "checkIn.checkedInAt": new Date()
            };
        } else {
            updateFields.$set = {
                "checkIn.status": "Hasn't Arrived",
                "checkIn.method": null,
                "checkIn.checkedInAt": null
            };
        }

        const updatedGuest = await Guest.findByIdAndUpdate(
            guestId,
            updateFields,
            { new: true, runValidators: true }
        ).lean();

        // 2. Format eventId as an object {_id, title} instead of a string
        if (updatedGuest.eventId) {
            const eventData = await Event.findById(updatedGuest.eventId, "title").lean();
            
            updatedGuest.eventId = {
                _id: updatedGuest.eventId.toString(),
                title: eventData ? eventData.title : "Unknown Event"
            };
        } else {
            updatedGuest.eventId = null;
        }

        // 3. Return the structurally perfect object
        res.status(200).json({ data: updatedGuest });

    } catch (err) {
        console.error("Error updating check-in:", err);
        res.status(500).json({ message: "Failed to update check in." });
    }
};
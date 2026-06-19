import mongoose from "mongoose";
import Event from "../models/modelEvent.js";

export function toObjectId(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
    return null;
  }
  return new mongoose.Types.ObjectId(String(id));
}

export async function findOrganizerEvent(userId, eventId) {
  const eventObjectId = toObjectId(eventId);
  if (!eventObjectId || !userId) {
    return null;
  }

  return Event.findOne({
    _id: eventObjectId,
    organizerId: userId,
  }).lean();
}

export async function staffHasEventAccess(staffId, eventId) {
  const staffObjectId = toObjectId(staffId);
  const eventObjectId = toObjectId(eventId);
  if (!staffObjectId || !eventObjectId) {
    return false;
  }

  const tasksCollection = mongoose.connection.db.collection("event_tasks");
  const task = await tasksCollection.findOne({
    assignedTo: staffObjectId,
    eventId: eventObjectId,
  });

  return !!task;
}

export async function canManageEventGuests(userId, role, eventId) {
  if (role === "organizer") {
    return !!(await findOrganizerEvent(userId, eventId));
  }

  if (role === "staff") {
    return staffHasEventAccess(userId, eventId);
  }

  return false;
}

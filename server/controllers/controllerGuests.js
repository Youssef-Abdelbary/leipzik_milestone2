import Guest from "../models/modelGuest.js";
import Event from "../models/modelEvent.js";
import { log } from "../utils/logger.js";

export const getGuests = async (req, res) =>{
    try {
        //console.log("Database:", Guest.db.name);
        //console.log("Collection:", Guest.collection.name);
        const guestsWithEvents = await Guest.find()
        .populate('eventId', 'title') 
        .lean();
        res.json({ data: guestsWithEvents });
    } catch (err) {
    res.status(500).json({ message: "Failed to fetch guests." });
  }
} 
export const updateGuestCheckIn = async (req, res) => {
    try {
        const guestId = req.params.id;
        const { status, method } = req.body;

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

        // 1. Fetch and update the guest as a plain, mutable object (.lean())
        const updatedGuest = await Guest.findByIdAndUpdate(
            guestId,
            updateFields,
            { new: true, runValidators: true }
        ).lean();

        if (!updatedGuest) {
            return res.status(404).json({ message: "Guest not found." });
        }

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
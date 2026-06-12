import Guest from "../models/modelGuest.js";
import { log } from "../utils/logger.js";

export const getGuests = async (req, res) =>{
    try {
        //console.log("Database:", Guest.db.name);
        //console.log("Collection:", Guest.collection.name);
        const guestsList = await Guest.find();
        res.json({ data: guestsList });
    } catch (err) {
    res.status(500).json({ message: "Failed to fetch guests." });
  }
} 
export const updateGuestCheckIn = async (req, res) => {
    try {
        const guestId = req.params.id;

        const { status, method } = req.body;

        const updateFields = {};

        if (status=== "Arrived") {
            updateFields.$set = {
                "checkIn.status": "Arrived", // matches your schema enum
                "checkIn.method": method,
                "checkIn.checkedInAt": new Date()
            };
        } else {
            updateFields.$set = {
                "checkIn.status": "Hasn't Arrived", // matches your schema enum
                "checkIn.method": null,
                "checkIn.checkedInAt": null
            };
        }

        const updatedGuest = await Guest.findByIdAndUpdate(
            guestId,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!updatedGuest) {
            return res.status(404).json({ message: "Guest not found." });
        }

        res.status(200).json({ data: updatedGuest });

    } catch (err) {
        console.error("Error updating check-in:", err);
        res.status(500).json({ message: "Failed to update check in." });
    }
};
import Guest from "../models/modelGuest.js";

export const getGuests = async (req, res) =>{
    try {
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

        const updatedGuest = await Guest.findByIdAndUpdate(
            guestId,
            {
                $set: {
                    "checkIn.status": status,
                    "checkIn.method": method,
                    "checkIn.checkedInAt": new Date()
                }
            },
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
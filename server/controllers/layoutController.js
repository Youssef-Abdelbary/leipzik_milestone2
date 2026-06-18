import User from "../models/User.js";
import EventLayout from "../models/EventLayout.js";

export async function getActiveStaff(req, res) {
  try {
    const staffMembers = await User.find({
      role: "staff",
      status: "active",
    }).select("_id fullName email");

    res.json(staffMembers);
  } catch (error) {
    console.error("Load staff error:", error);

    res.status(500).json({
      message: "Failed to load staff members",
    });
  }
}

export async function saveLayout(req, res) {
  try {
    const { eventId, title, elements, canvasSize } = req.body;

    if (!eventId) {
      return res.status(400).json({
        message: "Event ID is required to save a layout",
      });
    }

    const layout = await EventLayout.findOneAndUpdate(
      { eventId },
      {
        eventId,
        title: title || "Venue Layout",
        elements,
        canvasSize,
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(200).json({
      message: "Layout saved successfully for this event",
      layout,
    });
  } catch (error) {
    console.error("Save layout error:", error);

    res.status(500).json({
      message: "Failed to save layout",
    });
  }
}

export async function shareLayout(req, res) {
  try {
    const { layoutId } = req.params;
    const { staffIds } = req.body;

    if (!staffIds || !Array.isArray(staffIds)) {
      return res.status(400).json({
        message: "Staff IDs array is required",
      });
    }

    const layout = await EventLayout.findByIdAndUpdate(
      layoutId,
      {
        $set: {
          sharedWithStaff: staffIds,
        },
      },
      { new: true }
    );

    if (!layout) {
      return res.status(404).json({ message: "Layout not found" });
    }

    res.json({
      message: "Layout shared successfully with current event staff members",
      sharedCount: staffIds.length,
      layout,
    });
  } catch (error) {
    console.error("Share layout error:", error);
    res.status(500).json({ message: "Failed to share layout" });
  }
}

export async function getSharedLayoutsForStaff(req, res) {
  try {
    const { staffId } = req.params;

    const layouts = await EventLayout.find({
      sharedWithStaff: staffId,
    })
      .populate("eventId", "title name")
      .sort({ updatedAt: -1 });

    res.json(layouts);
  } catch (error) {
    console.error("Load shared layouts error:", error);

    res.status(500).json({
      message: "Failed to load shared layouts",
    });
  }
}

export async function getLayoutByEvent(req, res) {
  try {
    const { eventId } = req.params;

    const layout = await EventLayout.findOne({ eventId });

    if (!layout) {
      return res.json(null);
    }

    res.json(layout);
  } catch (error) {
    console.error("Load layout by event error:", error);

    res.status(500).json({
      message: "Failed to load layout for this event",
    });
  }
}
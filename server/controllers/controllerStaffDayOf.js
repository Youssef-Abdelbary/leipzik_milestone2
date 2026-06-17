import mongoose from "mongoose";

async function staffHasAccessToEvent(staffId, eventId) {
  const tasksCollection = mongoose.connection.db.collection("event_tasks");

  const task = await tasksCollection.findOne({
    assignedTo: new mongoose.Types.ObjectId(staffId),
    eventId: new mongoose.Types.ObjectId(eventId),
  });

  return !!task;
}

export async function getEventVendorsForStaff(req, res) {
  try {
    const { staffId, eventId } = req.params;

    const hasAccess = await staffHasAccessToEvent(staffId, eventId);

    if (!hasAccess) {
      return res.status(403).json({
        message: "You do not have access to this event's vendors.",
      });
    }

    const vendorRequestsCollection =
      mongoose.connection.db.collection("vendor_requests");

    const vendorProfilesCollection =
      mongoose.connection.db.collection("vendor_profiles");

    const usersCollection = mongoose.connection.db.collection("users");

    const vendorRequests = await vendorRequestsCollection
      .find({
        eventId: new mongoose.Types.ObjectId(eventId),
      })
      .toArray();

    const vendors = await Promise.all(
      vendorRequests.map(async (request) => {
        const vendorId = request.vendorId;

        let vendorUser = null;
        let vendorProfile = null;

        if (vendorId) {
          // Case 1: vendorId points to users._id
          vendorUser = await usersCollection.findOne({
            _id: new mongoose.Types.ObjectId(vendorId),
          });

          vendorProfile = await vendorProfilesCollection.findOne({
            userId: new mongoose.Types.ObjectId(vendorId),
          });

          // Case 2: vendorId points to vendor_profiles._id
          if (!vendorProfile) {
            vendorProfile = await vendorProfilesCollection.findOne({
              _id: new mongoose.Types.ObjectId(vendorId),
            });

            if (vendorProfile?.userId && !vendorUser) {
              vendorUser = await usersCollection.findOne({
                _id: new mongoose.Types.ObjectId(vendorProfile.userId),
              });
            }
          }
        }

        const arrivalStatus =
          request.arrivalStatus ||
          request.delivery?.status ||
          "not_arrived";

        return {
          _id: request._id,
          eventId: request.eventId,

          requestStatus: request.status || "pending",

          arrivalStatus,
          arrivedAt: request.arrivedAt || request.delivery?.arrivedAt || null,
          estimatedArrivalTime: request.delivery?.estimatedArrivalTime || null,

          vendorName:
            vendorProfile?.companyName ||
            vendorProfile?.businessName ||
            vendorUser?.fullName ||
            vendorUser?.fullname ||
            vendorUser?.name ||
            vendorUser?.email ||
            `Vendor ${String(request.vendorId).slice(-4)}`,

          serviceType:
            request.requestedItems?.[0]?.itemName ||
            vendorProfile?.suppliesOffered?.[0] ||
            "Not specified",

          email:
            vendorProfile?.contactInfo?.email ||
            vendorUser?.email ||
            "Not specified",

          phone:
            vendorProfile?.contactInfo?.phone ||
            vendorUser?.phone ||
            "Not specified",

          deliveryLocation:
            request.deliveryLocation?.venueName ||
            request.deliveryLocation?.address ||
            "Not specified",
        };
      })
    );

    res.json(vendors);
  } catch (error) {
    console.error("Get staff event vendors error:", error);
    res.status(500).json({ message: "Failed to load event vendors." });
  }
}

export async function markVendorArrived(req, res) {
  try {
    const { staffId, eventId, vendorRequestId } = req.params;

    const hasAccess = await staffHasAccessToEvent(staffId, eventId);

    if (!hasAccess) {
      return res.status(403).json({
        message: "You do not have access to update this event's vendors.",
      });
    }

    const vendorRequestsCollection =
      mongoose.connection.db.collection("vendor_requests");

    const updatedVendor = await vendorRequestsCollection.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(vendorRequestId),
        eventId: new mongoose.Types.ObjectId(eventId),
      },
      {
        $set: {
          arrivalStatus: "arrived",
          arrivedAt: new Date(),
          "delivery.status": "arrived",
          "delivery.arrivedAt": new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!updatedVendor) {
      return res.status(404).json({ message: "Vendor request not found." });
    }

    res.json({
      message: "Vendor marked as arrived.",
      vendor: updatedVendor,
    });
  } catch (error) {
    console.error("Mark vendor arrived error:", error);
    res.status(500).json({ message: "Failed to mark vendor as arrived." });
  }
}
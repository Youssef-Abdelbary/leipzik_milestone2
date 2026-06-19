import Venue from '../models/modelVenue.js';
import Booking from '../models/modelBooking.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
//import { uploadToCloudinary } from '../utils/cloudinaryUpload.js';
import { Readable } from 'stream';
import Notification from '../models/modelNotification.js';
import { ensureVenueListing } from '../utils/ensureVenueListing.js';

// ─── Multer + Cloudinary Setup ───────────────────────────────────────────────

export const upload = multer({ storage: multer.memoryStorage() });

async function uploadToCloudinary(buffer) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'venues', transformation: [{ width: 1200, quality: 'auto' }] },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        Readable.from(buffer).pipe(stream);
    });
}
// ─── 1. Get All My Listings ──────────────────────────────────────────────────

export async function getMyVenues(req, res) {
    try {
        await ensureVenueListing(req.user.user_id, { role: req.user.role });

        const venues = await Venue.find({
            ownerId:   req.user.user_id,
            isDeleted: false,
        }).lean();

        return res.status(200).json({ venues });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch venues', error: err.message });
    }
}

// ─── 2. Get Single Venue (with calendar data) ────────────────────────────────

export async function getVenueById(req, res) {
    try {
        const venue = await Venue.findOne({
            _id:       req.params.id,
            ownerId:   req.user.user_id,
            isDeleted: false,
        }).lean();

        if (!venue) return res.status(404).json({ message: 'Venue not found' });

        return res.status(200).json({ venue });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch venue', error: err.message });
    }
}

// ─── 3. Create Venue ─────────────────────────────────────────────────────────

export async function createVenue(req, res) {
    try {
        const {
            name, description,
            city, area, address,
            capacity, dimensionsSqm,
            amenities, bookedDates,
            basePrice, currency, pricingUnit,
        } = req.body;

        const photos = await Promise.all((req.files || []).map(async file => ({
            url:     await uploadToCloudinary(file.buffer),
            caption: '',
        })));

        const venue = await Venue.create({
            ownerId:      req.user.user_id,
            name,
            description,
            location:     { city, area, address },
            capacity,
            dimensionsSqm,
            amenities:    amenities    ? JSON.parse(amenities)    : [],
            bookedDates:  bookedDates  ? JSON.parse(bookedDates).map(d => ({ date: new Date(d) })) : [],
            pricing:      { basePrice, currency, pricingUnit },
            photos,
        });

        return res.status(201).json({ message: 'Venue created', venue });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to create venue', error: err.message });
    }
}

export async function updateVenue(req, res) {
  try {
    const venue = await Venue.findOne({
      _id: req.params.id,
      ownerId: req.user.user_id,
      isDeleted: false,
    });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const {
      name,
      description,
      city,
      area,
      address,
      capacity,
      dimensionsSqm,
      amenities,
      bookedDates,
      basePrice,
      currency,
      pricingUnit,
    } = req.body;

    if (name !== undefined) venue.name = name;
    if (description !== undefined) venue.description = description;
    if (city !== undefined) venue.location.city = city;
    if (area !== undefined) venue.location.area = area;
    if (address !== undefined) venue.location.address = address;

    if (capacity !== undefined) venue.capacity = Number(capacity);
    if (dimensionsSqm !== undefined) venue.dimensionsSqm = Number(dimensionsSqm);

    if (amenities !== undefined) {
      venue.amenities =
        typeof amenities === "string" ? JSON.parse(amenities) : amenities;
    }

    if (basePrice !== undefined) venue.pricing.basePrice = Number(basePrice);
    if (currency !== undefined) venue.pricing.currency = currency;
    if (pricingUnit !== undefined) venue.pricing.pricingUnit = pricingUnit;

    if (bookedDates !== undefined) {
      const parsedDates =
        typeof bookedDates === "string" ? JSON.parse(bookedDates) : bookedDates;

      const newDates = parsedDates.map((d) => ({
        date: new Date(d),
      }));

      venue.bookedDates.push(...newDates);
    }

    if (req.files && req.files.length > 0) {
      const newPhotos = await Promise.all(
        req.files.map(async (file) => ({
          url: await uploadToCloudinary(file.buffer),
          caption: "",
        }))
      );

      venue.photos.push(...newPhotos);
    }

    await venue.save();

    return res.status(200).json({
      message: "Venue updated",
      venue,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to update venue",
      error: err.message,
    });
  }
}

export async function deactivateVenue(req, res) {
  try {
    const venue = await Venue.findOne({
      _id: req.params.id,
      ownerId: req.user.user_id,
      isDeleted: false,
    });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    venue.isActive = false;

    await venue.save();

    return res.status(200).json({
      message: "Venue deactivated",
      venue,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to deactivate venue",
      error: err.message,
    });
  }
}

export async function activateVenue(req, res) {
  try {
    const venue = await Venue.findOne({
      _id: req.params.id,
      ownerId: req.user.user_id,
      isDeleted: false,
    });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    venue.isActive = true;

    await venue.save();

    return res.status(200).json({
      message: "Venue activated",
      venue,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to activate venue",
      error: err.message,
    });
  }
}

// ─── 5. Soft Delete Venue ────────────────────────────────────────────────────

export async function deleteVenue(req, res) {
    try {
        const venue = await Venue.findOneAndUpdate(
            { _id: req.params.id, ownerId: req.user.user_id },
            { isDeleted: true },
            { new: true }
        );

        if (!venue) return res.status(404).json({ message: 'Venue not found' });

        return res.status(200).json({ message: 'Venue deleted' });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to delete venue', error: err.message });
    }
}

// ─── 6. Book a Date ──────────────────────────────────────────────────────────

export async function bookDate(req, res) {
    try {
        const { date } = req.body;
        const requestedDate = new Date(date);
        requestedDate.setHours(0, 0, 0, 0);

        const venue = await Venue.findOne({
            _id:       req.params.id,
            isDeleted: false,
            isActive:  true,
        });

        if (!venue) return res.status(404).json({ message: 'Venue not found' });

        const alreadyBooked = venue.bookedDates.some(b => {
            const d = new Date(b.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === requestedDate.getTime();
        });

        if (alreadyBooked) {
            return res.status(409).json({ message: 'This date is already booked' });
        }

        const booking = await Booking.create({
            venueId:     venue._id,
            organizerId: req.user.user_id,
            date:        requestedDate,
            totalPrice:  venue.pricing.basePrice,
            currency:    venue.pricing.currency,
            status:      'pending',
        });

        venue.bookedDates.push({ date: requestedDate, bookingId: booking._id });
        await venue.save();

        return res.status(201).json({ message: 'Booking requested', booking });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to book date', error: err.message });
    }
}

// ─── 7. Cancel a Booking ─────────────────────────────────────────────────────

export async function cancelBooking(req, res) {
    try {
        const booking = await Booking.findOne({
            _id:         req.params.bookingId,
            organizerId: req.user.user_id,
        });

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

        booking.status = 'cancelled';
        await booking.save();

        await Venue.findByIdAndUpdate(booking.venueId, {
            $pull: { bookedDates: { bookingId: booking._id } },
        });

        return res.status(200).json({ message: 'Booking cancelled' });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to cancel booking', error: err.message });
    }
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function getNotifications(req, res) {
    try {
        const notifications = await Notification.find({ userId: req.user.user_id })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ notifications });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
    }
}

export async function markNotificationsRead(req, res) {
    try {
        const { ids } = req.body;            // optional array of notification _ids

        const filter = { userId: req.user.user_id, status: 'unread' };
        if (Array.isArray(ids) && ids.length > 0) filter._id = { $in: ids };

        await Notification.updateMany(filter, { status: 'read' });

        return res.status(200).json({ message: 'Notifications marked as read' });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to mark notifications', error: err.message });
    }
}
import BrowseVenue from "../models/modelBrowseVenue.js";
import Venue from "../models/modelVenue.js";

async function getOwnerVenueIds(ownerId) {
    const venues = await Venue.find({ ownerId, isDeleted: false }).select('_id').lean();
    return venues.map(v => v._id);
}

function startOfCurrentMonth() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function endOfCurrentMonth() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
}

export const getConfirmedBookings = async (req, res) => {
    try {
        const ownerId = req.user.user_id;
        const { venueId, status, startDate, endDate } = req.query;
        const ownedVenueIds = await getOwnerVenueIds(ownerId);

        const query = {
            venueOwnerId: ownerId,
            venueId: { $in: ownedVenueIds },
            status: status || 'approved',
        };

        if (venueId) query.venueId = venueId;

        if (startDate || endDate) {
            const match = {};
            if (startDate) match.$gte = new Date(startDate);
            if (endDate)   match.$lte = new Date(endDate);
            query.requestedDates = { $elemMatch: match };
        }

        const bookings = await BrowseVenue.find(query)
            .populate('venueId', 'name')
            .populate('organizerId', 'fullname email phone')
            .sort({ 'requestedDates.0': 1 })
            .lean();

        res.json({ data: bookings });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch confirmed bookings." });
    }
};

export const getBookingSummary = async (req, res) => {
    try {
        const ownerId = req.user.user_id;
        const { startDate, endDate } = req.query;

        const venues = await Venue.find({ ownerId, isDeleted: false }).select('_id name').lean();
        const venueIds = venues.map(v => v._id);

        const start = startDate ? new Date(startDate) : startOfCurrentMonth();
        const end   = endDate   ? new Date(endDate)   : endOfCurrentMonth();
        const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

        const bookings = await BrowseVenue.find({
            venueOwnerId: ownerId,
            venueId: { $in: venueIds },
            status: 'approved',
            requestedDates: { $elemMatch: { $gte: start, $lte: end } },
        }).lean();

        const perVenue = venues.map(v => {
            const venueBookings = bookings.filter(b => b.venueId.toString() === v._id.toString());

            let bookedDaySet = new Set();
            let revenue = 0;

            venueBookings.forEach(b => {
                const allDates = b.requestedDates || [];
                const insideDates = allDates.filter(d => {
                    const t = new Date(d).getTime();
                    return t >= start.getTime() && t <= end.getTime();
                });

                if (insideDates.length === 0) return;

                insideDates.forEach(d => bookedDaySet.add(new Date(d).toISOString().slice(0, 10)));

                const proratedAmount = (b.proposedPrice?.amount || 0) * (insideDates.length / allDates.length);
                revenue += proratedAmount;
            });

            const occupancyRate = Math.round((bookedDaySet.size / totalDays) * 1000) / 10;

            return {
                venueId: v._id,
                venueName: v.name,
                totalBookings: venueBookings.length,
                revenue: Math.round(revenue),
                occupancyRate,
            };
        });

        res.json({
            data: {
                period: { startDate: start, endDate: end, totalDays },
                venues: perVenue,
                totals: {
                    totalBookings: bookings.length,
                    totalRevenue: perVenue.reduce((sum, v) => sum + v.revenue, 0),
                },
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch booking summary." });
    }
};

export const getBookingHistory = async (req, res) => {
    try {
        const ownerId = req.user.user_id;
        const { venueId, status, startDate, endDate } = req.query;

        const ownedVenueIds = await getOwnerVenueIds(ownerId);

        const query = {
            venueOwnerId: ownerId,
            venueId: { $in: ownedVenueIds },
        };

        if (venueId) query.venueId = venueId;
        if (status)  query.status  = status;

        if (startDate || endDate) {
            const match = {};
            if (startDate) match.$gte = new Date(startDate);
            if (endDate)   match.$lte = new Date(endDate);
            query.requestedDates = { $elemMatch: match };
        }

        const history = await BrowseVenue.find(query)
            .populate('venueId', 'name')
            .populate('organizerId', 'fullname email')
            .sort({ updatedAt: -1 })
            .lean();

        const start = startDate ? new Date(startDate) : null;
        const end   = endDate   ? new Date(endDate)   : null;

        const historyWithFiltered = history.map(h => {
            if (!start && !end) return { ...h, filteredDates: h.requestedDates };
            const filtered = (h.requestedDates || []).filter(d => {
                const t = new Date(d).getTime();
                if (start && t < start.getTime()) return false;
                if (end   && t > end.getTime())   return false;
                return true;
            });
            return { ...h, filteredDates: filtered };
        });

        res.json({ data: historyWithFiltered });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch booking history." });
    }
};
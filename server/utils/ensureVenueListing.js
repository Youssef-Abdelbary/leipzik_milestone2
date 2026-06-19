import mongoose from 'mongoose';
import Venue from '../models/modelVenue.js';
import User from '../models/modelUser.js';

function toObjectId(userId) {
    if (!userId) return null;
    const id = typeof userId === 'string' ? userId : userId.toString();
    return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

function isVenueOwnerRole(role) {
    return (role || '').toLowerCase() === 'venue_owner';
}

/** Ensure at least one browseable venue listing exists for a venue owner account. */
export async function ensureVenueListing(userId, { role: jwtRole } = {}) {
    const userObjectId = toObjectId(userId);
    if (!userObjectId) return null;

    const existing = await Venue.findOne({ ownerId: userObjectId, isDeleted: false });
    if (existing) return existing;

    const user = await User.findById(userObjectId).lean();
    if (!user) return null;
    if (!isVenueOwnerRole(user.role) && !isVenueOwnerRole(jwtRole)) return null;

    try {
        return await Venue.create({
            ownerId: userObjectId,
            name: user.fullname || 'My Venue',
            description: '',
            location: { city: 'Cairo', area: '', address: '' },
            capacity: 50,
            amenities: [],
            pricing: { basePrice: 0, currency: 'EGP', pricingUnit: 'per_event' },
            photos: [],
            isActive: true,
            isDeleted: false,
        });
    } catch (err) {
        if (err.code === 11000) {
            return Venue.findOne({ ownerId: userObjectId, isDeleted: false });
        }
        throw err;
    }
}

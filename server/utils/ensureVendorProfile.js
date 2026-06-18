import mongoose from 'mongoose';
import Vendor from '../models/modelVendor.js';
import User from '../models/modelUser.js';

function toObjectId(userId) {
    if (!userId) return null;
    const id = typeof userId === 'string' ? userId : userId.toString();
    return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

async function findVendorProfile(userObjectId) {
    let profile = await Vendor.findOne({ userId: userObjectId });
    if (profile) return profile;
    return Vendor.findOne({ userId: userObjectId.toString() });
}

function isVendorRole(role) {
    return (role || '').toLowerCase() === 'vendor';
}

/** Ensure a vendor_profiles document exists for the given user account. */
export async function ensureVendorProfile(userId, { role: jwtRole } = {}) {
    const userObjectId = toObjectId(userId);
    if (!userObjectId) return null;

    let profile = await findVendorProfile(userObjectId);
    if (profile) return profile;

    const user = await User.findById(userObjectId).lean();
    if (!user) return null;
    if (!isVendorRole(user.role) && !isVendorRole(jwtRole)) return null;

    try {
        profile = await Vendor.findOneAndUpdate(
            { userId: userObjectId },
            {
                $setOnInsert: {
                    userId: userObjectId,
                    companyName: user.fullname || 'My Business',
                    contactInfo: {
                        contactPerson: user.fullname || '',
                        email: user.email || '',
                        phone: user.phone || '',
                    },
                    isActive: true,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return profile;
    } catch (err) {
        if (err.code === 11000) {
            return findVendorProfile(userObjectId);
        }
        throw err;
    }
}

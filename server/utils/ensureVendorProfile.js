import Vendor from '../models/modelVendor.js';
import User from '../models/modelUser.js';

/** Ensure a vendor_profiles document exists for the given user account. */
export async function ensureVendorProfile(userId) {
    let profile = await Vendor.findOne({ userId });
    if (profile) return profile;

    const user = await User.findById(userId).lean();
    if (!user || user.role !== 'vendor') return null;

    profile = await Vendor.create({
        userId: user._id,
        companyName: user.fullname || 'My Business',
        contactInfo: {
            contactPerson: user.fullname || '',
            email: user.email || '',
            phone: user.phone || '',
        },
        isActive: true,
    });
    return profile;
}

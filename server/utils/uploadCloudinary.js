import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

// Uploads a buffer (from multer memoryStorage) to Cloudinary and
// returns the resulting secure_url. `folder` lets each controller
// organize uploads (e.g. 'venues', 'invoices').
export async function uploadToCloudinary(buffer, folder, options = {}) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'auto', ...options },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        Readable.from(buffer).pipe(stream);
    });
}
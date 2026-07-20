import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary explicitly with the provided environment variables
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

/**
 * Uploads a raw buffer to Cloudinary.
 * We use resource_type 'auto' so Cloudinary handles images vs raw files (like pdf/excalidraw).
 */
export async function uploadAttachment(buffer: ArrayBuffer, hash: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'auto',
                public_id: hash, // Deduplicate/Identify by hash!
                folder: 'obsidian-rooms'
            },
            (error, result) => {
                if (error) return reject(error);
                if (result) return resolve(result.secure_url);
                reject(new Error("Unknown upload error"));
            }
        );
        
        // Convert ArrayBuffer to Node.js Buffer and write to stream
        uploadStream.end(Buffer.from(buffer));
    });
}

/**
 * Deletes an attachment from Cloudinary using its hash (which is its public_id).
 */
export async function deleteAttachment(hash: string): Promise<void> {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(`obsidian-rooms/${hash}`, (error, result) => {
            if (error) return reject(error);
            resolve();
        });
    });
}

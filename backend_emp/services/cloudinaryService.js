const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'xz0pls4y',
  api_key: process.env.CLOUDINARY_API_KEY || '986359291699247',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Wqgzj5HqBehZkg9MN-QQ3B0BcYs',
  secure: true
});

/**
 * Uploads and optimizes a profile photo on Cloudinary.
 * Automatically crops to a square, detects faces, converts to modern WebP/auto format,
 * and compresses for ultra-fast CDN delivery (<40 KB).
 */
async function uploadProfilePhoto(targetUserId, photoData) {
  if (!photoData) throw new Error('photoData is required');

  let filePayload = photoData;
  if (!filePayload.startsWith('data:')) {
    filePayload = `data:image/jpeg;base64,${filePayload}`;
  }

  const publicId = `user_${targetUserId}_${Date.now()}`;

  const result = await cloudinary.uploader.upload(filePayload, {
    folder: 'pwholdings/profile_photos',
    public_id: publicId,
    overwrite: true,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good', fetch_format: 'auto' }
    ]
  });

  return {
    url: result.secure_url,
    public_id: result.public_id,
    bytes: result.bytes,
    format: result.format
  };
}

/**
 * Uploads an employee document (PDF, image, etc.) to Cloudinary.
 */
async function uploadDocument(targetUserId, documentData, filename = 'document', mimeType = 'application/pdf') {
  if (!documentData) throw new Error('documentData is required');

  let filePayload = documentData;
  if (!filePayload.startsWith('data:')) {
    filePayload = `data:${mimeType};base64,${filePayload}`;
  }

  const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\-]/g, '_');
  const publicId = `${Date.now()}_${cleanName}`;

  const result = await cloudinary.uploader.upload(filePayload, {
    folder: `pwholdings/documents/${targetUserId}`,
    public_id: publicId,
    resource_type: 'auto',
    use_filename: true,
    unique_filename: true
  });

  return {
    url: result.secure_url,
    public_id: result.public_id,
    bytes: result.bytes,
    format: result.format,
    resource_type: result.resource_type
  };
}

/**
 * Deletes a file from Cloudinary by its public ID.
 */
async function deleteCloudinaryFile(publicId, resourceType = 'image') {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.warn(`Cloudinary delete warning for ${publicId}:`, err.message);
  }
}

module.exports = {
  cloudinary,
  uploadProfilePhoto,
  uploadDocument,
  deleteCloudinaryFile
};

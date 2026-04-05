// festnest-backend/config/cloudinary.js
'use strict';

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
  api_key    : process.env.CLOUDINARY_API_KEY,
  api_secret : process.env.CLOUDINARY_API_SECRET,
  secure     : true,
});

/**
 * Upload a Buffer to Cloudinary.
 * @param {Buffer} buffer
 * @param {string} folder       e.g. 'festnest/posters'
 * @param {string} resourceType 'image' | 'raw' (PDF)
 * @returns {Promise<object>}   Cloudinary upload result
 */
const uploadToCloudinary = (buffer, folder = 'festnest', resourceType = 'auto') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type : resourceType,
        quality       : 'auto',
        fetch_format  : 'auto',
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

/**
 * Delete an asset from Cloudinary by public_id.
 * Never throws — logs the error and resolves gracefully.
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return;
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error('[Cloudinary] delete error:', err.message);
  }
};

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary };

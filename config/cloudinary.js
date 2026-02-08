const cloudinary = require('cloudinary').v2;
const { getConfig } = require('./env');

/**
 * Configure Cloudinary for image uploads
 */

const config = getConfig();

/**
 * Initialize Cloudinary configuration
 * @throws {Error} If Cloudinary credentials are missing
 */
const configureCloudinary = () => {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('Cloudinary credentials not configured. Image upload features will be disabled.');
    return false;
  }

  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });

    console.log('Cloudinary configured successfully');
    return true;
  } catch (error) {
    console.error(`Cloudinary configuration error: ${error.message}`);
    return false;
  }
};

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to the file to upload
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Object>} Upload result
 */
const uploadImage = async (filePath, folder = 'construction-management') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error(`Cloudinary upload error: ${error.message}`);
    throw new Error('Failed to upload image');
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error(`Cloudinary delete error: ${error.message}`);
    throw new Error('Failed to delete image');
  }
};

module.exports = {
  configureCloudinary,
  uploadImage,
  deleteImage,
  cloudinary
};

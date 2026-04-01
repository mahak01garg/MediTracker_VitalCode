const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloud = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: 'meditracker/profile-pictures',
      resource_type: 'image',
      overwrite: true
    });

    // Delete the local file after upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    
    return response;
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    // Clean up local file on error
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw error;
  }
};

const destroyFromCloud = async (fileUrl) => {
  if (!fileUrl || !/^https?:\/\/res\.cloudinary\.com\//i.test(fileUrl)) {
    return;
  }

  try {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const uploadIndex = pathParts.findIndex((part) => part === 'upload');
    const publicIdWithVersion = pathParts.slice(uploadIndex + 1).join('/');
    const publicId = publicIdWithVersion.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');

    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Cloudinary delete failed:', error);
  }
};

module.exports = { uploadToCloud, destroyFromCloud };

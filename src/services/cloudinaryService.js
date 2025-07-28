const axios = require('axios');

class CloudinaryService {
  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    this.uploadPreset = 'ml_default';
  }

  async uploadImage(imageBase64) {
    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          file: imageBase64,
          upload_preset: this.uploadPreset,
        }
      );
      return response.data.secure_url;
    } catch (error) {
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  async uploadMultipleImages(imagesBase64) {
    if (!Array.isArray(imagesBase64) || imagesBase64.length === 0) {
      return [];
    }

    const uploadPromises = imagesBase64.map(imageBase64 => 
      this.uploadImage(imageBase64)
    );

    return await Promise.all(uploadPromises);
  }
}

module.exports = new CloudinaryService();

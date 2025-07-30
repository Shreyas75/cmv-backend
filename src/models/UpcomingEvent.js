const mongoose = require('mongoose');

const upcomingEventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  schedule: {
    type: String,
    required: true,
  },
  highlights: [{
    type: String,
  }],
  contact: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: function() {
      // Only required if images array is empty (backward compatibility)
      return !this.images || this.images.length === 0;
    }
  },
  images: [{
    type: String,
    validate: {
      validator: function(url) {
        // Basic URL validation for image URLs
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      },
      message: 'Please provide a valid image URL'
    }
  }],
  // Virtual field to get all images (single + array)
}, {
  timestamps: true,
});

// Virtual field to get all images combined
upcomingEventSchema.virtual('allImages').get(function() {
  const images = [];
  if (this.image) images.push(this.image);
  if (this.images && this.images.length > 0) images.push(...this.images);
  return images;
});

// Ensure virtual fields are included in JSON output
upcomingEventSchema.set('toJSON', { virtuals: true });
upcomingEventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UpcomingEvent', upcomingEventSchema);

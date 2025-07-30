const mongoose = require('mongoose');

const featuredEventSchema = new mongoose.Schema({
  name: {
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
  coverImage: {
    type: String,
    required: true,
  },
  images: [{
    type: String,
  }],
}, {
  timestamps: true,
});

// Virtual field to get all images combined
featuredEventSchema.virtual('allImages').get(function() {
  const images = [];
  if (this.coverImage) images.push(this.coverImage);
  if (this.images && this.images.length > 0) images.push(...this.images);
  return images;
});

// Ensure virtual fields are included in JSON output
featuredEventSchema.set('toJSON', { virtuals: true });
featuredEventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FeaturedEvent', featuredEventSchema);

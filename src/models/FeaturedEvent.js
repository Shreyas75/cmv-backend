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
  date: {
    type: Date,
    required: true,
    default: Date.now
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

// Virtual field for sharing metadata
featuredEventSchema.virtual('shareUrl').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'https://chinmayamissionvasai.com';
  return `${baseUrl}/featured-events/${this._id}`;
});

featuredEventSchema.virtual('metaTitle').get(function() {
  return `${this.name} - Chinmaya Mission Vasai`;
});

featuredEventSchema.virtual('metaDescription').get(function() {
  return this.description.length > 160 ? 
    this.description.substring(0, 157) + '...' : 
    this.description;
});

featuredEventSchema.virtual('ogImage').get(function() {
  return this.coverImage;
});

// Year virtual field for potential future filtering
featuredEventSchema.virtual('year').get(function() {
  return this.date ? this.date.getFullYear() : new Date(this.createdAt).getFullYear();
});

// Ensure virtual fields are included in JSON output
featuredEventSchema.set('toJSON', { virtuals: true });
featuredEventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FeaturedEvent', featuredEventSchema);

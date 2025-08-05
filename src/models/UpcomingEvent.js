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
    required: true,
  },
  images: [{
    type: String,
  }],
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

// Virtual field for sharing metadata
upcomingEventSchema.virtual('shareUrl').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'https://chinmayamissionvasai.com';
  return `${baseUrl}/upcoming-events/${this._id}`;
});

upcomingEventSchema.virtual('metaTitle').get(function() {
  return `${this.eventName} - Chinmaya Mission Vasai`;
});

upcomingEventSchema.virtual('metaDescription').get(function() {
  return this.description.length > 160 ? 
    this.description.substring(0, 157) + '...' : 
    this.description;
});

upcomingEventSchema.virtual('ogImage').get(function() {
  return this.image;
});

// Ensure virtual fields are included in JSON output
upcomingEventSchema.set('toJSON', { virtuals: true });
upcomingEventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UpcomingEvent', upcomingEventSchema);

const mongoose = require('mongoose');

const archivedEventSchema = new mongoose.Schema({
  title: {
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
  time: {
    type: String,
    required: false
  },
  location: {
    type: String,
    required: false
  },
  organizer: {
    type: String,
    required: false
  },
  attendees: {
    type: Number,
    required: false,
    min: 0
  },
  highlights: [{
    type: String,
  }],
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
archivedEventSchema.virtual('allImages').get(function() {
  const images = [];
  if (this.coverImage) images.push(this.coverImage);
  if (this.images && this.images.length > 0) images.push(...this.images);
  return images;
});

// Virtual field for sharing metadata
archivedEventSchema.virtual('shareUrl').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'https://chinmayamissionvasai.com';
  return `${baseUrl}/archived-events/${this._id}`;
});

archivedEventSchema.virtual('metaTitle').get(function() {
  return `${this.title} - Chinmaya Mission Vasai`;
});

archivedEventSchema.virtual('metaDescription').get(function() {
  return this.description.length > 160 ? 
    this.description.substring(0, 157) + '...' : 
    this.description;
});

archivedEventSchema.virtual('ogImage').get(function() {
  return this.coverImage;
});

// Year virtual field for filtering
archivedEventSchema.virtual('year').get(function() {
  return this.date ? this.date.getFullYear() : new Date(this.createdAt).getFullYear();
});

// Ensure virtual fields are included in JSON output
archivedEventSchema.set('toJSON', { virtuals: true });
archivedEventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ArchivedEvent', archivedEventSchema);

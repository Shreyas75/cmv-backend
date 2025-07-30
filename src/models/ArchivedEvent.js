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

// Ensure virtual fields are included in JSON output
archivedEventSchema.set('toJSON', { virtuals: true });
archivedEventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ArchivedEvent', archivedEventSchema);

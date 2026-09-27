const mongoose = require('mongoose');

const resourceFileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
  },
  format: {
    type: String,
  },
  bytes: {
    type: Number,
  },
}, { _id: true });

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  audioFiles: {
    type: [resourceFileSchema],
    default: [],
  },
  pdfFiles: {
    type: [resourceFileSchema],
    default: [],
  },
}, {
  timestamps: true,
});

resourceSchema.virtual('audioCount').get(function () {
  return this.audioFiles?.length || 0;
});

resourceSchema.virtual('pdfCount').get(function () {
  return this.pdfFiles?.length || 0;
});

resourceSchema.set('toJSON', { virtuals: true });
resourceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Resource', resourceSchema);

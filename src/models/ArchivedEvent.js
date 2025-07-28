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

module.exports = mongoose.model('ArchivedEvent', archivedEventSchema);

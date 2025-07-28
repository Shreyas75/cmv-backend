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
}, {
  timestamps: true,
});

module.exports = mongoose.model('UpcomingEvent', upcomingEventSchema);

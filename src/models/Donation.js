const mongoose = require('mongoose');
const crypto = require('crypto');

const donationSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, index: true },
  phoneNumber: { type: String, required: true, trim: true },
  panCardNumber: { type: String, set: v => v ? crypto.createHash('sha256').update(v).digest('hex') : undefined },
  state: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  pinCode: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  seek80G: { type: String, required: true, enum: ['yes', 'no'] },
  amount: { type: Number, required: true, min: 1 },
  transactionId: { type: String, required: true, unique: true, index: true },
  reasonForDonation: { type: String, required: true, enum: [
    'Gurudakshina', 'General Donation', 'Event Sponsorship', 'Building Fund', 'Educational Support', 'Community Service', 'Special Occasion', 'Other'
  ] },
  purpose: { type: String },
  donationRef: { type: String, required: true, unique: true, index: true },
  status: { type: String, default: 'pending', enum: ['pending', 'completed', 'failed'] },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

donationSchema.index({ transactionId: 1 }, { unique: true });
donationSchema.index({ donationRef: 1 }, { unique: true });

donationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Donation', donationSchema);

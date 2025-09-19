const mongoose = require('mongoose');

const cgcc2025RegistrationSchema = new mongoose.Schema({
  registrationId: {
    type: String,
    unique: true,
    index: true
    // Not required since it's auto-generated in pre-save middleware
  },
  registrationVia: {
    type: String,
    required: true,
    enum: ['Balavihar Centre', 'School', 'Other'],
    trim: true
  },
  otherSpecify: {
    type: String,
    trim: true,
    // Will be validated conditionally in the controller
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  middleName: {
    type: String,
    trim: true,
    maxlength: 50,
    default: ''
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  participantName: {
    type: String,
    trim: true,
    index: true
    // Not required since it's auto-generated in pre-save middleware
  },
  schoolName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  standard: {
    type: String,
    required: true,
    enum: ['Kindergarten', 'Jr. KG', 'Sr. KG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'],
    trim: true
  },
  parentName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  mobileNo: {
    type: String,
    required: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
    index: true
  },
  emailAddress: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'],
    index: true
  },
  dateOfBirth: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  competitionYear: {
    type: Number,
    required: true,
    default: 2025
  },
  registrationDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate registrations (email + mobile combination)
cgcc2025RegistrationSchema.index({ emailAddress: 1, mobileNo: 1 }, { unique: true });

// Pre-save middleware to generate participant name
cgcc2025RegistrationSchema.pre('save', function(next) {
  // Generate full participant name
  const parts = [this.firstName];
  if (this.middleName && this.middleName.trim()) {
    parts.push(this.middleName);
  }
  parts.push(this.lastName);
  this.participantName = parts.join(' ');
  
  // Generate unique registration ID if not provided
  if (!this.registrationId) {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.registrationId = `CGCC2025${timestamp}${randomNum}`;
  }
  
  next();
});

module.exports = mongoose.model('CGCC2025Registration', cgcc2025RegistrationSchema);

const axios = require('axios')
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();



const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({limit:'10mb'}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use 'gmail' or another email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Temporary in-memory store for OTPs (use Redis for production)
const otpStore = {};

// Define schemas and models
const carouselItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
});

const upcomingEventSchema = new mongoose.Schema({
  eventName: String,
  description: String,
  schedule: String,
  highlights: [String],
  contact: String,
  image: String,
});

const featuredEventSchema = new mongoose.Schema({
  name: String,
  description: String,
  schedule: String,
  highlights: [String],
  contact: String,
  image: String,
});

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phoneNo: Number,
  dob: Date,
  additionalComments: String
})

const CarouselItem = mongoose.model('CarouselItem', carouselItemSchema);
const UpcomingEvent = mongoose.model('UpcomingEvent', upcomingEventSchema);
const FeaturedEvent = mongoose.model('FeaturedEvent', featuredEventSchema);
const User = mongoose.model('User', userSchema);


// Generate and send OTP via email
app.post('/api/send-otp-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Generate a 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Store OTP with expiration (5 minutes)
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
  console.log('OTP Store:', otpStore);

  try {
    // Send OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
    });

    res.json({ message: 'OTP sent to email' });
    console.log(otpStore);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});


app.post('/api/verify-otp', async (req, res) => {
  const { identifier, otp } = req.body;

  console.log('Request Body:', req.body); // Log the entire request body
  console.log('Identifier:', identifier); // Log the identifier
  console.log('OTP:', otp); // Log the OTP
  console.log('Current OTP Store:', otpStore); // Log the current OTP store

  if (!identifier || !otp) {
    return res.status(400).json({ success: false, error: 'Identifier and OTP are required' });
  }

  const storedOtp = otpStore[identifier];

  if (!storedOtp) {
    return res.status(400).json({ success: false, error: 'OTP not found or expired' });
  }

  if (storedOtp.otp !== otp) {
    return res.status(400).json({ success: false, error: 'Invalid OTP' });
  }

  if (Date.now() > storedOtp.expiresAt) {
    delete otpStore[identifier];
    return res.status(400).json({ success: false, error: 'OTP expired. Please request a new one.' });
  }

  // OTP is valid, allow user to proceed
  delete otpStore[identifier]; // Clear OTP after successful verification
  res.json({ success: true, message: 'OTP verified successfully' });
});

// Submit user details
app.post('/api/submit-user-details', async (req, res) => {
  const { userData } = req.body;

  if (!userData || !userData.email) {
    return res.status(400).json({ error: 'User details are required' });
  }

  try {
    const newUser = new User(userData);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/volunteer', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Define API routes
app.get('/api/carousel-items', async (req, res) => {
  const items = await CarouselItem.find();
  res.json(items);
});

app.post('/api/carousel-items', async (req, res) => {
  const newItem = new CarouselItem(req.body);
  await newItem.save();
  res.json(newItem);
});

app.delete('/api/carousel-items/:id', async (req, res) => {
  await CarouselItem.findByIdAndDelete(req.params.id);
  res.json({ message: 'Item deleted' });
});

app.get('/api/upcoming-events', async (req, res) => {
  const events = await UpcomingEvent.find();
  res.json(events);
});

app.post('/api/upcoming-events', async (req, res) => {
  const newEvent = new UpcomingEvent(req.body);
  await newEvent.save();
  res.json(newEvent);
});

app.delete('/api/upcoming-events/:id', async (req, res) => {
  await UpcomingEvent.findByIdAndDelete(req.params.id);
  res.json({ message: 'Event deleted' });
});

app.get('/api/featured-events', async (req, res) => {
  const events = await FeaturedEvent.find();
  res.json(events);
});

app.post('/api/featured-events', async (req, res) => {
  const newEvent = new FeaturedEvent(req.body);
  await newEvent.save();
  res.json(newEvent);
});

app.delete('/api/featured-events/:id', async (req, res) => {
  await FeaturedEvent.findByIdAndDelete(req.params.id);
  res.json({ message: 'Event deleted' });
});


// cloudinary upload endpoint

app.post('/api/upload-image', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const uploadResponse = await axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        file: imageBase64,
        upload_preset: 'ml_default',
      }
    );

    res.json({ imageUrl: uploadResponse.data.secure_url });
  } catch (err) {
    console.error('Error uploading image to Cloudinary:', err.message);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
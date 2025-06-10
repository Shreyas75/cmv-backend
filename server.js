const axios = require('axios')
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
require('dotenv').config();



const app = express();
const port = process.env.PORT || 5001;

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

const archivedEventSchema = new mongoose.Schema({
  title: String,
  description: String,
  coverImage: String,
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phoneNo: Number,
  dob: Date,
  additionalComments: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CarouselItem = mongoose.model('CarouselItem', carouselItemSchema);
const UpcomingEvent = mongoose.model('UpcomingEvent', upcomingEventSchema);
const FeaturedEvent = mongoose.model('FeaturedEvent', featuredEventSchema);
const ArchivedEvent = mongoose.model('ArchivedEvent', archivedEventSchema);
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

// Archived events routes
app.get('/api/archived-events', async (req, res) => {
  try {
    const events = await ArchivedEvent.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/archived-events', async (req, res) => {
  try {
    const { title, description, coverImageBase64, imagesBase64 } = req.body;

    console.log('Request body received:', {
      title,
      description,
      hasCoverImage: !!coverImageBase64,
      imagesCount: imagesBase64 ? imagesBase64.length : 0
    });

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    let coverImageUrl = '';
    let imageUrls = [];

    // Upload cover image to Cloudinary if provided
    if (coverImageBase64) {
      try {
        console.log('Uploading cover image...');
        const coverImageResponse = await axios.post(
          `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            file: coverImageBase64,
            upload_preset: 'ml_default',
          }
        );
        coverImageUrl = coverImageResponse.data.secure_url;
        console.log('Cover image uploaded:', coverImageUrl);
      } catch (error) {
        console.error('Error uploading cover image to Cloudinary:', error.message);
        return res.status(500).json({ error: 'Failed to upload cover image' });
      }
    }

    // Upload additional images to Cloudinary if provided
    if (imagesBase64 && Array.isArray(imagesBase64) && imagesBase64.length > 0) {
      try {
        console.log(`Uploading ${imagesBase64.length} additional images...`);
        const uploadPromises = imagesBase64.map(async (imageBase64, index) => {
          console.log(`Uploading image ${index + 1}...`);
          const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
              file: imageBase64,
              upload_preset: 'ml_default',
            }
          );
          console.log(`Image ${index + 1} uploaded:`, response.data.secure_url);
          return response.data.secure_url;
        });

        imageUrls = await Promise.all(uploadPromises);
        console.log('All images uploaded:', imageUrls);
      } catch (error) {
        console.error('Error uploading images to Cloudinary:', error.message);
        return res.status(500).json({ error: 'Failed to upload images' });
      }
    } else {
      console.log('No additional images to upload');
    }

    console.log('Creating archived event with:', {
      title,
      description,
      coverImageUrl,
      imageUrls,
      imageCount: imageUrls.length
    });

    // Create new archived event
    const newArchivedEvent = new ArchivedEvent({
      title,
      description,
      coverImage: coverImageUrl,
      images: imageUrls,
    });

    await newArchivedEvent.save();
    console.log('Archived event saved:', newArchivedEvent);
    res.status(201).json(newArchivedEvent);
  } catch (error) {
    console.error('Error creating archived event:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/archived-events/:id', async (req, res) => {
  try {
    await ArchivedEvent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Archived event deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single archived event by ID
app.get('/api/archived-events/:id', async (req, res) => {
  try {
    const event = await ArchivedEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Archived event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error fetching archived event:', error);
    res.status(500).json({ error: error.message });
  }
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

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    res.status(200).json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});




// Change the route to match your frontend call
app.get("/api/export-user-data", async (req, res) => {
  try {
    // Authenticate the request (optional - consider adding authentication)
    // if (!req.headers.authorization) {
    //   return res.status(401).json({ error: 'Authentication required' });
    // }

    // Fetch all users from the database
    const users = await User.find({}, 'firstName lastName email phoneNo dob additionalComments createdAt');
    
    if (users.length === 0) {
      // Since frontend expects a blob, we should avoid returning JSON for errors
      // Instead, create a CSV with a message
      const emptyCSV = "No users found in the database.";
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=volunteer-data-empty.csv');
      return res.send(emptyCSV);
    }

    // Convert user data to CSV
    const fields = ['firstName', 'lastName', 'email', 'phoneNo', 'dob', 'additionalComments', 'createdAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(users);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=volunteer-data.csv');
    
    // Send the CSV directly without saving to disk
    res.send(csv);

  } catch (error) {
    console.error('Error exporting user data:', error.message);
    // Send a CSV with error information instead of JSON
    const errorCSV = "Error exporting data. Please try again later.";
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=export-error.csv');
    res.status(500).send(errorCSV);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
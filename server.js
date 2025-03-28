// filepath: /path/to/cmv-backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
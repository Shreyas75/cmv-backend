const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const carouselRoutes = require('./carouselRoutes');
const upcomingEventRoutes = require('./upcomingEventRoutes');
const featuredEventRoutes = require('./featuredEventRoutes');
const archivedEventRoutes = require('./archivedEventRoutes');
const utilityRoutes = require('./utilityRoutes');
const donationRoutes = require('./donation');

const router = express.Router();

router.use('/api', authRoutes);
router.use('/api', userRoutes);
router.use('/api/carousel-items', carouselRoutes);
router.use('/api/upcoming-events', upcomingEventRoutes);
router.use('/api/featured-events', featuredEventRoutes);
router.use('/api/archived-events', archivedEventRoutes);
router.use('/api', utilityRoutes);
router.use('/api/donations', donationRoutes);

module.exports = router;

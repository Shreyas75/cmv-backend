const FeaturedEvent = require('../models/FeaturedEvent');
const cloudinaryService = require('../services/cloudinaryService');

class FeaturedEventController {
  async getAllEvents(req, res) {
    try {
      const { sortBy = 'date_desc', search } = req.query;
      
      // Build query filters
      let query = {};
      
      // Search filtering
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { schedule: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Build sort options
      let sortOptions = {};
      switch (sortBy) {
        case 'date_asc':
          sortOptions = { date: 1, createdAt: 1 };
          break;
        case 'date_desc':
        default:
          sortOptions = { date: -1, createdAt: -1 };
          break;
        case 'title_asc':
          sortOptions = { name: 1 };
          break;
        case 'title_desc':
          sortOptions = { name: -1 };
          break;
      }
      
      const events = await FeaturedEvent.find(query).sort(sortOptions);
      
      // Add caching headers
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEventById(req, res) {
    try {
      const event = await FeaturedEvent.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: 'Featured event not found' });
      }
      
      // Add caching headers
      res.set('Cache-Control', 'public, max-age=600'); // 10 minutes
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createEvent(req, res) {
    try {
      const { name, description, date, schedule, highlights, contact, coverImageBase64, imagesBase64 } = req.body;

      if (!name || !description || !schedule || !contact) {
        return res.status(400).json({ error: 'Name, description, schedule, and contact are required' });
      }

      let coverImageUrl = '';
      let imageUrls = [];

      // Upload cover image to Cloudinary if provided
      if (coverImageBase64) {
        try {
          coverImageUrl = await cloudinaryService.uploadImage(coverImageBase64);
        } catch (error) {
          return res.status(500).json({ error: 'Failed to upload cover image' });
        }
      }

      // Upload additional images to Cloudinary if provided
      if (imagesBase64 && Array.isArray(imagesBase64) && imagesBase64.length > 0) {
        try {
          imageUrls = await cloudinaryService.uploadMultipleImages(imagesBase64);
        } catch (error) {
          return res.status(500).json({ error: 'Failed to upload images' });
        }
      }

      // Create new featured event
      const newFeaturedEvent = new FeaturedEvent({
        name,
        description,
        date: date ? new Date(date) : new Date(),
        schedule,
        highlights: highlights || [],
        contact,
        coverImage: coverImageUrl,
        images: imageUrls,
      });

      await newFeaturedEvent.save();
      res.status(201).json(newFeaturedEvent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteEvent(req, res) {
    try {
      await FeaturedEvent.findByIdAndDelete(req.params.id);
      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new FeaturedEventController();

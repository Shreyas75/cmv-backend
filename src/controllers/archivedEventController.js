const ArchivedEvent = require('../models/ArchivedEvent');
const cloudinaryService = require('../services/cloudinaryService');

class ArchivedEventController {
  async getAllEvents(req, res) {
    try {
      const events = await ArchivedEvent.find().sort({ createdAt: -1 });
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEventById(req, res) {
    try {
      const event = await ArchivedEvent.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: 'Archived event not found' });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createEvent(req, res) {
    try {
      const { title, description, coverImageBase64, imagesBase64 } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
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

      // Create new archived event
      const newArchivedEvent = new ArchivedEvent({
        title,
        description,
        coverImage: coverImageUrl,
        images: imageUrls,
      });

      await newArchivedEvent.save();
      res.status(201).json(newArchivedEvent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteEvent(req, res) {
    try {
      await ArchivedEvent.findByIdAndDelete(req.params.id);
      res.json({ message: 'Archived event deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ArchivedEventController();

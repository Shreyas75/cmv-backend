const ArchivedEvent = require('../models/ArchivedEvent');
const cloudinaryService = require('../services/cloudinaryService');

class ArchivedEventController {
  async getAllEvents(req, res) {
    try {
      const { sortBy = 'date_desc', year, search } = req.query;
      
      // Build query filters
      let query = {};
      
      // Year filtering
      if (year) {
        const yearInt = parseInt(year);
        const startDate = new Date(yearInt, 0, 1);
        const endDate = new Date(yearInt + 1, 0, 1);
        query.date = { $gte: startDate, $lt: endDate };
      }
      
      // Search filtering
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
          { organizer: { $regex: search, $options: 'i' } }
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
          sortOptions = { title: 1 };
          break;
        case 'title_desc':
          sortOptions = { title: -1 };
          break;
      }
      
      const events = await ArchivedEvent.find(query).sort(sortOptions);
      
      // Add caching headers
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
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
      
      // Add caching headers for individual events
      res.set('Cache-Control', 'public, max-age=600'); // 10 minutes
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAvailableYears(req, res) {
    try {
      const years = await ArchivedEvent.aggregate([
        {
          $group: {
            _id: { $year: "$date" },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: -1 }
        },
        {
          $project: {
            year: "$_id",
            count: 1,
            _id: 0
          }
        }
      ]);
      
      // Add long caching for years (changes infrequently)
      res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
      res.json(years);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createEvent(req, res) {
    try {
      const { 
        title, 
        description, 
        date,
        time,
        location,
        organizer,
        attendees,
        highlights,
        coverImageBase64, 
        imagesBase64 
      } = req.body;

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
        date: date ? new Date(date) : new Date(),
        time,
        location,
        organizer,
        attendees: attendees ? parseInt(attendees) : undefined,
        highlights: highlights || [],
        coverImage: coverImageUrl,
        images: imageUrls,
      });

      await newArchivedEvent.save();
      res.status(201).json(newArchivedEvent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      // Handle date conversion
      if (updateData.date) {
        updateData.date = new Date(updateData.date);
      }
      
      // Handle attendees conversion
      if (updateData.attendees) {
        updateData.attendees = parseInt(updateData.attendees);
      }

      // Handle image uploads if provided
      if (updateData.coverImageBase64) {
        try {
          updateData.coverImage = await cloudinaryService.uploadImage(updateData.coverImageBase64);
          delete updateData.coverImageBase64;
        } catch (error) {
          return res.status(500).json({ error: 'Failed to upload cover image' });
        }
      }

      if (updateData.imagesBase64 && Array.isArray(updateData.imagesBase64)) {
        try {
          updateData.images = await cloudinaryService.uploadMultipleImages(updateData.imagesBase64);
          delete updateData.imagesBase64;
        } catch (error) {
          return res.status(500).json({ error: 'Failed to upload images' });
        }
      }

      const updatedEvent = await ArchivedEvent.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      );

      if (!updatedEvent) {
        return res.status(404).json({ error: 'Archived event not found' });
      }

      res.json(updatedEvent);
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

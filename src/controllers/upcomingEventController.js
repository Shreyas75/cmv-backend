const UpcomingEvent = require('../models/UpcomingEvent');

class UpcomingEventController {
  async getAllEvents(req, res) {
    try {
      const { sortBy = 'date_desc', search } = req.query;
      
      // Build query filters
      let query = {};
      
      // Search filtering
      if (search) {
        query.$or = [
          { eventName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { schedule: { $regex: search, $options: 'i' } },
          { contact: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Build sort options
      let sortOptions = {};
      switch (sortBy) {
        case 'date_asc':
          sortOptions = { createdAt: 1 };
          break;
        case 'date_desc':
        default:
          sortOptions = { createdAt: -1 };
          break;
        case 'title_asc':
          sortOptions = { eventName: 1 };
          break;
        case 'title_desc':
          sortOptions = { eventName: -1 };
          break;
      }
      
      const events = await UpcomingEvent.find(query).sort(sortOptions);
      
      // Add caching headers
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createEvent(req, res) {
    try {
      const eventData = req.body;
      
      // Handle image validation
      if (!eventData.image && (!eventData.images || eventData.images.length === 0)) {
        return res.status(400).json({ 
          error: 'At least one image is required (either image or images array)' 
        });
      }

      // Validate images array if provided
      if (eventData.images && Array.isArray(eventData.images)) {
        const invalidImages = eventData.images.filter(img => 
          typeof img !== 'string' || !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(img)
        );
        
        if (invalidImages.length > 0) {
          return res.status(400).json({ 
            error: 'All images must be valid URLs ending with .jpg, .jpeg, .png, .gif, or .webp' 
          });
        }
      }

      const newEvent = new UpcomingEvent(eventData);
      await newEvent.save();
      res.status(201).json(newEvent);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Handle image validation for updates
      if (updateData.images && Array.isArray(updateData.images)) {
        const invalidImages = updateData.images.filter(img => 
          typeof img !== 'string' || !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(img)
        );
        
        if (invalidImages.length > 0) {
          return res.status(400).json({ 
            error: 'All images must be valid URLs ending with .jpg, .jpeg, .png, .gif, or .webp' 
          });
        }
      }

      const updatedEvent = await UpcomingEvent.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      );

      if (!updatedEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json(updatedEvent);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteEvent(req, res) {
    try {
      const deletedEvent = await UpcomingEvent.findByIdAndDelete(req.params.id);
      
      if (!deletedEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEventById(req, res) {
    try {
      const event = await UpcomingEvent.findById(req.params.id);
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Add caching headers
      res.set('Cache-Control', 'public, max-age=600'); // 10 minutes
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new UpcomingEventController();

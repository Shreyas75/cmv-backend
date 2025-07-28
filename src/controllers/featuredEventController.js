const FeaturedEvent = require('../models/FeaturedEvent');

class FeaturedEventController {
  async getAllEvents(req, res) {
    try {
      const events = await FeaturedEvent.find();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createEvent(req, res) {
    try {
      const newEvent = new FeaturedEvent(req.body);
      await newEvent.save();
      res.status(201).json(newEvent);
    } catch (error) {
      res.status(400).json({ error: error.message });
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

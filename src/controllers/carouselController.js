const CarouselItem = require('../models/CarouselItem');

class CarouselController {
  async getAllItems(req, res) {
    try {
      const items = await CarouselItem.find();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createItem(req, res) {
    try {
      const newItem = new CarouselItem(req.body);
      await newItem.save();
      res.status(201).json(newItem);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteItem(req, res) {
    try {
      await CarouselItem.findByIdAndDelete(req.params.id);
      res.json({ message: 'Item deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new CarouselController();

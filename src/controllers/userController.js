const User = require('../models/User');

class UserController {
  async submitUserDetails(req, res) {
    try {
      const { userData } = req.body;

      if (!userData || !userData.email) {
        return res.status(400).json({ error: 'User details are required' });
      }

      const newUser = new User(userData);
      await newUser.save();
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async registerVolunteer(req, res) {
    try {
      const newUser = new User(req.body);
      await newUser.save();
      res.status(201).json(newUser);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new UserController();

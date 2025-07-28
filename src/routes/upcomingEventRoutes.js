const express = require('express');
const upcomingEventController = require('../controllers/upcomingEventController');

const router = express.Router();

router.get('/', upcomingEventController.getAllEvents);
router.post('/', upcomingEventController.createEvent);
router.delete('/:id', upcomingEventController.deleteEvent);

module.exports = router;

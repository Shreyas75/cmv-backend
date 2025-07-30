const express = require('express');
const upcomingEventController = require('../controllers/upcomingEventController');

const router = express.Router();

router.get('/', upcomingEventController.getAllEvents);
router.get('/:id', upcomingEventController.getEventById);
router.post('/', upcomingEventController.createEvent);
router.put('/:id', upcomingEventController.updateEvent);
router.delete('/:id', upcomingEventController.deleteEvent);

module.exports = router;

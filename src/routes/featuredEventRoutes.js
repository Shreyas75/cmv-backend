const express = require('express');
const featuredEventController = require('../controllers/featuredEventController');

const router = express.Router();

router.get('/', featuredEventController.getAllEvents);
router.post('/', featuredEventController.createEvent);
router.delete('/:id', featuredEventController.deleteEvent);

module.exports = router;

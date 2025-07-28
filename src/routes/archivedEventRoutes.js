const express = require('express');
const archivedEventController = require('../controllers/archivedEventController');

const router = express.Router();

router.get('/', archivedEventController.getAllEvents);
router.get('/:id', archivedEventController.getEventById);
router.post('/', archivedEventController.createEvent);
router.delete('/:id', archivedEventController.deleteEvent);

module.exports = router;

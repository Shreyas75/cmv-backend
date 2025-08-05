const express = require('express');
const archivedEventController = require('../controllers/archivedEventController');

const router = express.Router();

// GET /api/archived-events?sortBy=date_desc&year=2024&search=keyword
router.get('/', archivedEventController.getAllEvents);

// GET /api/archived-events/years - Must come before /:id route
router.get('/years', archivedEventController.getAvailableYears);

// GET /api/archived-events/{id} - For individual event access and sharing
router.get('/:id', archivedEventController.getEventById);

// POST /api/archived-events - Admin only (create new event)
router.post('/', archivedEventController.createEvent);

// PUT /api/archived-events/{id} - Admin only (update existing event)
router.put('/:id', archivedEventController.updateEvent);

// DELETE /api/archived-events/{id} - Admin only
router.delete('/:id', archivedEventController.deleteEvent);

module.exports = router;

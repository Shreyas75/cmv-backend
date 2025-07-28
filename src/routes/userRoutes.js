const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/submit-user-details', userController.submitUserDetails);
router.post('/volunteer', userController.registerVolunteer);

module.exports = router;

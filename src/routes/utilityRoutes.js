const express = require('express');
const utilityController = require('../controllers/utilityController');

const router = express.Router();

router.post('/upload-image', utilityController.uploadImage);
router.get('/export-user-data', utilityController.exportUserData);

module.exports = router;

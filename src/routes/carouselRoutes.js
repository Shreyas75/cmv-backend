const express = require('express');
const carouselController = require('../controllers/carouselController');

const router = express.Router();

router.get('/', carouselController.getAllItems);
router.post('/', carouselController.createItem);
router.delete('/:id', carouselController.deleteItem);

module.exports = router;

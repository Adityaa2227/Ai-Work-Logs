const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

router.get('/latest', feedbackController.getLatestFeedback);
router.post('/generate', feedbackController.generateFeedback);

module.exports = router;

const express = require('express');
const router = express.Router();
const { generatePPOReview, generateLearningReport, generateContributionReport, generateSprintSummary, getSavedReviews } = require('../controllers/reviewController');

router.post('/ppo', generatePPOReview);
router.post('/learning', generateLearningReport);
router.post('/contribution', generateContributionReport);
router.post('/sprint', generateSprintSummary);
router.get('/', getSavedReviews);

module.exports = router;

const express = require('express');
const router = express.Router();
const { generateReport, getLatestSummary, getInsight } = require('../controllers/aiController');

router.post('/generate', generateReport);
router.post('/insight', getInsight);
router.get('/latest', getLatestSummary);

module.exports = router;

const express = require('express');
const router = express.Router();
const { 
    getWeeklySummaries, 
    getMonthlySummaries,
    generateWeeklySummary,
    generateMonthlySummary,
    updateSummary
} = require('../controllers/summaryController');
const { exportSummaries } = require('../controllers/exportController');

// Export functionality
router.get('/export', exportSummaries);

// Get all weekly summaries
router.get('/weekly', getWeeklySummaries);

// Get all monthly summaries
router.get('/monthly', getMonthlySummaries);

// Manually generate weekly summary
router.post('/weekly/generate', generateWeeklySummary);

// Manually generate monthly summary
router.post('/monthly/generate', generateMonthlySummary);

// Update summary content
router.put('/:id', updateSummary);

module.exports = router;

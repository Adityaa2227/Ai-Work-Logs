const express = require('express');
const router = express.Router();
const { getLogs, createLog, updateLog, deleteLog, getSuggestions, getLatestLog, getPendingLogs } = require('../controllers/logController');
const { exportLogs, exportBundle } = require('../controllers/exportController');

router.get('/pending', getPendingLogs); // Must be before /:id
router.get('/suggestions', getSuggestions); // Must be before /:id
router.get('/latest', getLatestLog); // Must be before /:id
router.get('/export/bundle', exportBundle); // Specific path before generic /export if needed, though they are distinct
router.get('/export', exportLogs);
router.get('/', getLogs);
router.post('/', createLog);
router.put('/:id', updateLog);
router.delete('/:id', deleteLog);

module.exports = router;

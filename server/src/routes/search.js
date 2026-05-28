const express = require('express');
const router = express.Router();
const { searchLogs, aiSearchLogs } = require('../controllers/searchController');

router.get('/', searchLogs);
router.post('/ai', aiSearchLogs);

module.exports = router;

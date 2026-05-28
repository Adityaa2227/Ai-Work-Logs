const express = require('express');
const router = express.Router();
const { getHistory, sendMessage } = require('../controllers/ppoController');

router.get('/history', getHistory);
router.post('/message', sendMessage);

module.exports = router;

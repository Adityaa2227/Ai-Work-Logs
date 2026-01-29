const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getVapidPublicKey, subscribe } = require('../controllers/notificationController');

router.get('/vapid-public-key', getVapidPublicKey);
router.post('/subscribe', protect, subscribe);

module.exports = router;

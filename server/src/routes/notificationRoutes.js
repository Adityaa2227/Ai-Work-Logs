const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getVapidPublicKey, subscribe, sendTestNotification } = require('../controllers/notificationController');

router.get('/vapid-public-key', getVapidPublicKey);
router.post('/subscribe', protect, subscribe);
router.post('/test', protect, sendTestNotification);

module.exports = router;

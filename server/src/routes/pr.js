const express = require('express');
const router = express.Router();
const { getPRActivities, createPRActivity, updatePRActivity, deletePRActivity, getPRStats } = require('../controllers/prController');

router.get('/stats', getPRStats);
router.get('/', getPRActivities);
router.post('/', createPRActivity);
router.put('/:id', updatePRActivity);
router.delete('/:id', deletePRActivity);

module.exports = router;

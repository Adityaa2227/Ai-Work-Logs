const express = require('express');
const router = express.Router();
const { getDashboardStats, getChartData, getHeatmapData } = require('../controllers/statsController');

router.get('/kpi', getDashboardStats);
router.get('/charts', getChartData);
router.get('/heatmap', getHeatmapData);

module.exports = router;

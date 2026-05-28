const express = require('express');
const router = express.Router();
const { getDashboardStats, getChartData, getHeatmapData, getEngineeringStats } = require('../controllers/statsController');

router.get('/kpi', getDashboardStats);
router.get('/charts', getChartData);
router.get('/heatmap', getHeatmapData);
router.get('/engineering', getEngineeringStats);

module.exports = router;

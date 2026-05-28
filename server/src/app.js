const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/summaries', require('./routes/summaryRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/pr', require('./routes/pr'));
app.use('/api/review', require('./routes/review'));
app.use('/api/search', require('./routes/search'));
app.use('/api/ppo', require('./routes/ppoRoutes'));
const { initNotifications } = require('./services/notificationService');
initNotifications();


app.get('/', (req, res) => {
    res.json({ message: 'API is running...' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Server Error', error: err.message });
});

module.exports = app;

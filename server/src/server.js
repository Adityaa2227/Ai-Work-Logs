require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to Database
const startServer = async () => {
    await connectDB();
    
    // Seed default user
    const { seedUser } = require('./controllers/authController');
    await seedUser();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();

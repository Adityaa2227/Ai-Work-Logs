const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const seedUser = async () => {
    try {
        const existingUser = await User.findOne({ username: 'Aditya' });
        if (!existingUser) {
            const hashedPassword = await bcrypt.hash('Aditya', 10);
            await User.create({
                username: 'Aditya',
                password: hashedPassword
            });
            console.log('Default user "Aditya" created per requirements.');
        } else {
            console.log('Default user "Aditya" already exists.');
        }
    } catch (error) {
        console.error('Error seeding user:', error);
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 7 days expiration as requested
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'fallback_secret_should_be_in_env', 
            { expiresIn: '7d' }
        );

        res.json({ token, user: { username: user.username } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

module.exports = {
    seedUser,
    login
};

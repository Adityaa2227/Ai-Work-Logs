const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        console.log('Auth Middleware: Token found:', req.headers.authorization.substring(0, 20) + '...');
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_should_be_in_env');

            req.user = await User.findById(decoded.userId).select('-password');

            next();
        } catch (error) {
            console.error('Not authorized, token failed');
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        console.log('Auth Middleware: No token found. Headers:', req.headers);
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };

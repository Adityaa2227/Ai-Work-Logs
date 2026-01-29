const Company = require('../models/Company');

// @desc    Get all companies
// @route   GET /api/companies
// @access  Public
exports.getCompanies = async (req, res) => {
    try {
        const companies = await Company.find().sort({ createdAt: -1 });
        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new company
// @route   POST /api/companies
// @access  Public
exports.createCompany = async (req, res) => {
    try {
        const { name } = req.body;
        const company = await Company.create({ name });
        res.status(201).json(company);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Company already exists' });
        }
        res.status(400).json({ message: error.message });
    }
};

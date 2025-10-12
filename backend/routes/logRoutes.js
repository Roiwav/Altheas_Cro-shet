// routes/logRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { getAllLogs } = require('../controllers/logController');

// Get all activity logs (admin only)
router.get('/all', verifyToken, requireAdmin, getAllLogs);

module.exports = router;

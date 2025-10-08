const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');

router.get('/my', verifyToken, getMyNotifications);
router.patch('/:id/read', verifyToken, markAsRead);
router.patch('/read-all', verifyToken, markAllAsRead);

module.exports = router;

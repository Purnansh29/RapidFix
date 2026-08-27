const express = require('express');
const router = express.Router();
const { getMessages, markAsRead } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// All chat routes are protected
router.use(protect);

router.get('/:jobId', getMessages);
router.put('/:jobId/read', markAsRead);

module.exports = router;

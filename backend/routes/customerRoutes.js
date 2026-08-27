const express = require('express');
const router = express.Router();
const { getNearbyWorkers } = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Route to get nearby available workers
// GET /api/customer/workers/nearby
router.get('/workers/nearby', protect, authorize('customer'), getNearbyWorkers);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateStatus,
  updateLocation,
  updateProfile,
} = require('../controllers/workerController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication & worker role
router.use(protect);
router.use(authorize('worker'));

// GET /api/worker/profile - Get profile & availability status
router.get('/profile', getProfile);

// PUT /api/worker/profile - Update category, experience, details
router.put('/profile', updateProfile);

// PUT /api/worker/status - Go Online/Offline, Available/Busy
router.put('/status', updateStatus);

// PUT /api/worker/location - Sync live coordinates
router.put('/location', updateLocation);

module.exports = router;

const express = require('express');
const router = express.Router();
const { 
  getDashboardStats, 
  getAllUsers, 
  toggleUserStatus, 
  getAllJobs 
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected and restricted to admin only
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/status', toggleUserStatus);
router.get('/jobs', getAllJobs);

module.exports = router;

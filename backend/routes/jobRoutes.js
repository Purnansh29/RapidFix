const express = require('express');
const router = express.Router();
const {
  createJob,
  respondToJob,
  getMyJobs,
  cancelJob,
  completeJob,
} = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

// All job routes are protected
router.use(protect);

router.post('/', createJob);
router.get('/my', getMyJobs);
router.put('/:id/respond', respondToJob);
router.put('/:id/cancel', cancelJob);
router.put('/:id/complete', completeJob);

module.exports = router;

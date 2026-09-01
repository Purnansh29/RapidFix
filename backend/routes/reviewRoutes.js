const express = require('express');
const router = express.Router();
const { createReview, getWorkerReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.get('/worker/:workerId', getWorkerReviews);

module.exports = router;

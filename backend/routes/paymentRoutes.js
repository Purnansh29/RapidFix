const express = require('express');
const router = express.Router();
const { getWorkerEarnings } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/earnings', getWorkerEarnings);

module.exports = router;

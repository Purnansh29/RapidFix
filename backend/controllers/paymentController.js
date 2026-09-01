const Payment = require('../models/Payment');
const Job = require('../models/Job');

// @desc    Get worker earnings and payment history
// @route   GET /api/payments/earnings
// @access  Private (Worker only)
exports.getWorkerEarnings = async (req, res) => {
  try {
    const payments = await Payment.find({ workerId: req.user.id })
      .populate('jobId', 'category')
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });

    const totalEarnings = payments
      .filter(p => p.status === 'Completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingEarnings = payments
      .filter(p => p.status === 'Pending')
      .reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        pendingEarnings,
        history: payments
      }
    });
  } catch (error) {
    console.error('Get Earnings Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching earnings' });
  }
};

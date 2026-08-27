const Message = require('../models/Message');
const Job = require('../models/Job');

// @desc    Get message history for a specific job booking
// @route   GET /api/chat/:jobId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check authorization: make sure job exists and req.user is either the customer or worker
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job booking not found' });
    }

    const isCustomer = job.customerId.toString() === req.user.id;
    const isWorker = job.workerId && job.workerId.toString() === req.user.id;

    if (!isCustomer && !isWorker) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this chat' });
    }

    const messages = await Message.find({ jobId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name')
      .populate('receiverId', 'name');

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving chat history' });
  }
};

// @desc    Mark all messages in a conversation as read
// @route   PUT /api/chat/:jobId/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job booking not found' });
    }

    // Mark messages sent by the other party to me as read
    await Message.updateMany(
      { jobId, receiverId: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read successfully',
    });
  } catch (error) {
    console.error('Mark As Read Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating read status' });
  }
};

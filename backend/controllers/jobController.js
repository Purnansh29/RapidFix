const Job = require('../models/Job');
const WorkerProfile = require('../models/WorkerProfile');
const Payment = require('../models/Payment');

// @desc    Create a new job request
// @route   POST /api/jobs
// @access  Private (Customer only)
exports.createJob = async (req, res) => {
  try {
    const { category, description, address, latitude, longitude, budget, isEmergency, workerId } = req.body;

    if (!category || !description || !address || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Please provide category, description, address, and location' });
    }

    // Find the target worker profile
    const workerProfile = await WorkerProfile.findOne({ userId: workerId });
    if (!workerProfile || !workerProfile.isOnline || !workerProfile.isAvailable) {
      return res.status(400).json({ success: false, message: 'Worker is not available at the moment' });
    }

    const job = await Job.create({
      customerId: req.user.id,
      workerId: workerId || null,
      category,
      description,
      address,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      budget: budget ? parseFloat(budget) : undefined,
      isEmergency: isEmergency || false,
      status: 'Pending',
    });

    // Populate customer details for the socket event
    const User = require('../models/User');
    const customer = await User.findById(req.user.id).select('name phone');

    // Emit real-time notification to the worker via Socket.IO
    const io = req.app.get('io');
    if (io && workerId) {
      io.to(`user_${workerId}`).emit('job:newRequest', {
        jobId: job._id,
        category: job.category,
        description: job.description,
        address: job.address,
        budget: job.budget,
        isEmergency: job.isEmergency,
        customer: {
          name: customer?.name,
          phone: customer?.phone,
        },
        createdAt: job.createdAt,
      });
    }

    res.status(201).json({ success: true, message: 'Job request sent successfully', data: job });
  } catch (error) {
    console.error('Create Job Error:', error);
    res.status(500).json({ success: false, message: 'Server error creating job' });
  }
};

// @desc    Worker accepts or rejects a job
// @route   PUT /api/jobs/:id/respond
// @access  Private (Worker only)
exports.respondToJob = async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    const job = await Job.findById(req.params.id);

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.workerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this job' });
    }
    if (job.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Job is already ${job.status}` });
    }

    if (action === 'accept') {
      job.status = 'Accepted';
      // Mark worker as busy (no longer available for other bookings)
      await WorkerProfile.findOneAndUpdate({ userId: req.user.id }, { isAvailable: false });
    } else if (action === 'reject') {
      job.status = 'Cancelled';
      job.cancelledBy = req.user.id;
      job.cancelledAt = new Date();
      job.cancellationReason = 'Worker rejected the request';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Use "accept" or "reject"' });
    }

    await job.save();

    // Notify the customer in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${job.customerId}`).emit('job:statusUpdated', {
        jobId: job._id,
        status: job.status,
        workerId: req.user.id,
      });
    }

    res.status(200).json({ success: true, message: `Job ${action}ed successfully`, data: job });
  } catch (error) {
    console.error('Respond To Job Error:', error);
    res.status(500).json({ success: false, message: 'Server error responding to job' });
  }
};

// @desc    Get jobs for the authenticated user (customer or worker)
// @route   GET /api/jobs/my
// @access  Private
exports.getMyJobs = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'customer') {
      filter.customerId = req.user.id;
    } else if (req.user.role === 'worker') {
      filter.workerId = req.user.id;
    }

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('customerId', 'name phone')
      .populate('workerId', 'name phone');

    res.status(200).json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    console.error('Get My Jobs Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching jobs' });
  }
};

// @desc    Cancel a job
// @route   PUT /api/jobs/:id/cancel
// @access  Private
exports.cancelJob = async (req, res) => {
  try {
    const { reason } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const isCustomer = job.customerId.toString() === req.user.id;
    const isWorker = job.workerId && job.workerId.toString() === req.user.id;

    if (!isCustomer && !isWorker) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this job' });
    }

    if (['Completed', 'Cancelled'].includes(job.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a job that is already ${job.status}` });
    }

    job.status = 'Cancelled';
    job.cancelledBy = req.user.id;
    job.cancelledAt = new Date();
    job.cancellationReason = reason || 'Cancelled by user';

    // Always mark worker as available again if the job was cancelled (unless it was just pending, in which case they were already available, but it's safe to set it again)
    if (job.workerId) {
      await WorkerProfile.findOneAndUpdate({ userId: job.workerId }, { isAvailable: true });
    }

    await job.save();

    // Notify the other party
    const io = req.app.get('io');
    if (io) {
      const notifyUserId = isCustomer ? job.workerId : job.customerId;
      if (notifyUserId) {
        io.to(`user_${notifyUserId}`).emit('job:statusUpdated', {
          jobId: job._id,
          status: 'Cancelled',
          cancelledBy: req.user.id,
        });
      }
    }

    res.status(200).json({ success: true, message: 'Job cancelled successfully', data: job });
  } catch (error) {
    console.error('Cancel Job Error:', error);
    res.status(500).json({ success: false, message: 'Server error cancelling job' });
  }
};

// @desc    Complete a job
// @route   PUT /api/jobs/:id/complete
// @access  Private (Worker only)
exports.completeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.workerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to complete this job' });
    }
    if (!['Accepted', 'InProgress'].includes(job.status)) {
      return res.status(400).json({ success: false, message: `Cannot complete a job with status ${job.status}` });
    }

    job.status = 'Completed';
    
    // Mark worker as available again
    await WorkerProfile.findOneAndUpdate({ userId: req.user.id }, { isAvailable: true });
    
    await job.save();

    // Auto-create a payment record for this completed job
    if (job.budget && job.budget > 0) {
      await Payment.findOneAndUpdate(
        { jobId: job._id },
        {
          jobId: job._id,
          customerId: job.customerId,
          workerId: job.workerId,
          amount: job.budget,
          status: 'Completed',
          paymentMethod: 'Cash',
          transactionId: `TXN-${Date.now()}`
        },
        { upsert: true, new: true }
      );
    }

    // Notify customer
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${job.customerId}`).emit('job:statusUpdated', {
        jobId: job._id,
        status: 'Completed',
        workerId: req.user.id,
      });
    }

    res.status(200).json({ success: true, message: 'Job marked as completed', data: job });
  } catch (error) {
    console.error('Complete Job Error:', error);
    res.status(500).json({ success: false, message: 'Server error completing job' });
  }
};

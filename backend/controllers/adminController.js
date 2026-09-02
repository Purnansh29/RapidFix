const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Job = require('../models/Job');

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalWorkers = await User.countDocuments({ role: 'worker' });
    
    const totalJobs = await Job.countDocuments();
    const completedJobs = await Job.countDocuments({ status: 'Completed' });
    const activeJobs = await Job.countDocuments({ status: { $in: ['Pending', 'Accepted', 'InProgress'] } });
    
    // Simulate total revenue (e.g. platform fee is 10% of total budget)
    // For a real app, you'd aggregate over completed jobs' payments
    const jobsWithBudget = await Job.find({ status: 'Completed', budget: { $gt: 0 } });
    const totalJobVolume = jobsWithBudget.reduce((sum, job) => sum + job.budget, 0);
    const estimatedRevenue = totalJobVolume * 0.10; // 10% platform fee

    res.status(200).json({
      success: true,
      data: {
        users: totalUsers,
        workers: totalWorkers,
        jobs: {
          total: totalJobs,
          completed: completedJobs,
          active: activeJobs,
        },
        revenue: estimatedRevenue
      }
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
};

// @desc    Get all users (customers and workers)
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
      
    // Enrich workers with their WorkerProfile
    const workerUserIds = users.filter(u => u.role === 'worker').map(u => u._id);
    const workerProfiles = await WorkerProfile.find({ userId: { $in: workerUserIds } }).lean();
    
    const profileMap = {};
    workerProfiles.forEach(p => {
      profileMap[p.userId.toString()] = p;
    });

    const enrichedUsers = users.map(u => ({
      ...u,
      workerProfile: profileMap[u._id.toString()] || null
    }));

    res.status(200).json({ success: true, count: enrichedUsers.length, data: enrichedUsers });
  } catch (error) {
    console.error('Admin Users Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
};

// @desc    Toggle user active status (Ban/Unban)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.isActive = user.isActive === false ? true : false;
    await user.save();

    // If worker is deactivated, also force them offline/suspended
    if (user.role === 'worker') {
      await WorkerProfile.findOneAndUpdate(
        { userId: user._id },
        { 
          isSuspended: !user.isActive, 
          isOnline: user.isActive ? undefined : false,
          isAvailable: user.isActive ? undefined : false,
        }
      );
    }
    
    res.status(200).json({ 
      success: true, 
      message: `User is now ${user.isActive ? 'Active' : 'Banned/Inactive'}`, 
      data: user 
    });
  } catch (error) {
    console.error('Admin Toggle User Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating user status' });
  }
};

// @desc    Approve/Verify or Revoke worker verification
// @route   PUT /api/admin/workers/:id/verify
// @access  Private (Admin only)
exports.toggleWorkerVerification = async (req, res) => {
  try {
    const { isVerified } = req.body;
    let profile = await WorkerProfile.findOne({ userId: req.params.id });
    
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }

    profile.isVerified = isVerified !== undefined ? isVerified : !profile.isVerified;
    
    // If worker is revoked/unverified, force offline
    if (!profile.isVerified) {
      profile.isOnline = false;
      profile.isAvailable = false;
    }
    
    await profile.save();

    res.status(200).json({
      success: true,
      message: `Worker account has been ${profile.isVerified ? 'Approved' : 'Unverified'}`,
      data: profile,
    });
  } catch (error) {
    console.error('Admin Toggle Worker Verification Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating worker verification' });
  }
};

// @desc    Get all jobs
// @route   GET /api/admin/jobs
// @access  Private (Admin only)
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('customerId', 'name phone')
      .populate('workerId', 'name phone')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    console.error('Admin Jobs Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching jobs' });
  }
};

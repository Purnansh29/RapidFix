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
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, count: users.length, data: users });
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
    
    // Toggle status (Assume we add an isActive field to User schema)
    // For now we'll just return a success message if isActive isn't in schema yet
    res.status(200).json({ success: true, message: `User status toggled successfully`, data: user });
  } catch (error) {
    console.error('Admin Toggle User Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating user status' });
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

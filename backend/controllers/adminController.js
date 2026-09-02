const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Job = require('../models/Job');
const Review = require('../models/Review');
const Payment = require('../models/Payment');

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
    
    // Aggregate completed jobs revenue
    const jobsWithBudget = await Job.find({ status: 'Completed', budget: { $gt: 0 } });
    const totalJobVolume = jobsWithBudget.reduce((sum, job) => sum + (job.budget || 0), 0);
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

// @desc    Get all users (customers and workers) with review & job stats
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
      
    const workerUserIds = users.filter(u => u.role === 'worker').map(u => u._id);
    const customerUserIds = users.filter(u => u.role === 'customer').map(u => u._id);

    // Fetch Worker Profiles
    const workerProfiles = await WorkerProfile.find({ userId: { $in: workerUserIds } }).lean();
    const profileMap = {};
    workerProfiles.forEach(p => {
      profileMap[p.userId.toString()] = p;
    });

    // Count reviews received by workers
    const workerReviews = await Review.aggregate([
      { $match: { workerId: { $in: workerUserIds } } },
      { $group: { _id: '$workerId', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
    ]);
    const workerReviewMap = {};
    workerReviews.forEach(r => {
      workerReviewMap[r._id.toString()] = r;
    });

    // Count reviews given by customers
    const customerReviews = await Review.aggregate([
      { $match: { customerId: { $in: customerUserIds } } },
      { $group: { _id: '$customerId', count: { $sum: 1 } } }
    ]);
    const customerReviewMap = {};
    customerReviews.forEach(r => {
      customerReviewMap[r._id.toString()] = r.count;
    });

    // Count bookings by customers
    const customerJobs = await Job.aggregate([
      { $match: { customerId: { $in: customerUserIds } } },
      { $group: { _id: '$customerId', totalBookings: { $sum: 1 }, completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } } } }
    ]);
    const customerJobMap = {};
    customerJobs.forEach(j => {
      customerJobMap[j._id.toString()] = j;
    });

    const enrichedUsers = users.map(u => {
      const uid = u._id.toString();
      if (u.role === 'worker') {
        const reviewData = workerReviewMap[uid] || { count: 0, avgRating: 0 };
        return {
          ...u,
          workerProfile: profileMap[uid] || null,
          reviewsCount: reviewData.count,
          averageRating: reviewData.avgRating ? parseFloat(reviewData.avgRating.toFixed(1)) : (profileMap[uid]?.rating || 0),
        };
      } else {
        const jobData = customerJobMap[uid] || { totalBookings: 0, completedBookings: 0 };
        return {
          ...u,
          reviewsGivenCount: customerReviewMap[uid] || 0,
          totalBookings: jobData.totalBookings,
          completedBookings: jobData.completedBookings,
        };
      }
    });

    res.status(200).json({ success: true, count: enrichedUsers.length, data: enrichedUsers });
  } catch (error) {
    console.error('Admin Users Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
};

// @desc    Get complete details of a specific user/professional including all reviews & jobs
// @route   GET /api/admin/users/:id/details
// @access  Private (Admin only)
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let workerProfile = null;
    let reviews = [];
    let jobs = [];

    if (user.role === 'worker') {
      workerProfile = await WorkerProfile.findOne({ userId: user._id }).lean();
      reviews = await Review.find({ workerId: user._id })
        .populate('customerId', 'name phone email profileImage')
        .sort({ createdAt: -1 })
        .lean();
      jobs = await Job.find({ workerId: user._id })
        .populate('customerId', 'name phone')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    } else {
      reviews = await Review.find({ customerId: user._id })
        .populate('workerId', 'name phone')
        .sort({ createdAt: -1 })
        .lean();
      jobs = await Job.find({ customerId: user._id })
        .populate('workerId', 'name phone')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        workerProfile,
        reviews,
        jobs,
      }
    });
  } catch (error) {
    console.error('Admin User Details Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user details' });
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

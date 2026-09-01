const Review = require('../models/Review');
const Job = require('../models/Job');
const WorkerProfile = require('../models/WorkerProfile');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private (Customer only)
exports.createReview = async (req, res) => {
  try {
    const { jobId, rating, comment } = req.body;

    if (!jobId || !rating) {
      return res.status(400).json({ success: false, message: 'Please provide jobId and rating' });
    }

    // Verify job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Verify user is the customer who created the job
    if (job.customerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this job' });
    }

    // Verify job is completed
    if (job.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Cannot review a job that is not completed' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ jobId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Review already submitted for this job' });
    }

    // Create review
    const review = await Review.create({
      jobId,
      customerId: req.user.id,
      workerId: job.workerId,
      rating: Number(rating),
      comment
    });

    // Update worker profile rating
    const workerProfile = await WorkerProfile.findOne({ userId: job.workerId });
    if (workerProfile) {
      const currentTotalRatings = workerProfile.totalRatings || 0;
      const currentRating = workerProfile.rating || 0;
      
      const newTotalRatings = currentTotalRatings + 1;
      const newAverageRating = ((currentRating * currentTotalRatings) + Number(rating)) / newTotalRatings;
      
      workerProfile.rating = newAverageRating;
      workerProfile.totalRatings = newTotalRatings;
      await workerProfile.save();
    }

    res.status(201).json({ success: true, message: 'Review submitted successfully', data: review });
  } catch (error) {
    console.error('Create Review Error:', error);
    res.status(500).json({ success: false, message: 'Server error creating review' });
  }
};

// @desc    Get reviews for a worker
// @route   GET /api/reviews/worker/:workerId
// @access  Public
exports.getWorkerReviews = async (req, res) => {
  try {
    const { workerId } = req.params;
    
    const reviews = await Review.find({ workerId })
      .sort({ createdAt: -1 })
      .populate('customerId', 'name profileImage');
      
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    console.error('Get Worker Reviews Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching reviews' });
  }
};

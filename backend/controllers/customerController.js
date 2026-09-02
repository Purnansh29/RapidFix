const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');

// @desc    Get nearby available workers by category
// @route   GET /api/customer/workers/nearby
// @access  Private (or Public, but we'll protect it)
exports.getNearbyWorkers = async (req, res) => {
  try {
    const { latitude, longitude, category, radius } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both latitude and longitude coordinates',
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    // Default radius is 10km (10000 meters)
    const searchRadius = radius ? parseFloat(radius) : 10000; 

    // Build the query
    const query = {
      isOnline: true,
      isAvailable: true,
      isSuspended: false,
      isVerified: true,
    };

    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') }; // Case-insensitive matching
    }

    // GeoJSON geospatial query using $near
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat], // [longitude, latitude]
        },
        $maxDistance: searchRadius, // Distance in meters
      },
    };

    // Find and populate user details (excluding password)
    const workers = await WorkerProfile.find(query)
      .populate({
        path: 'userId',
        select: 'name email phone profileImage address',
      });

    // Format the response to combine user info and profile info nicely
    const formattedWorkers = workers
      .filter(w => w.userId) // Ensure User details are present
      .map(w => ({
        _id: w._id,
        userId: w.userId._id,
        name: w.userId.name,
        email: w.userId.email,
        phone: w.userId.phone,
        profileImage: w.userId.profileImage,
        address: w.userId.address,
        category: w.category,
        experience: w.experience,
        description: w.description,
        rating: w.rating,
        totalRatings: w.totalRatings,
        completedJobs: w.completedJobs,
        location: w.location.coordinates, // [longitude, latitude]
        distance: w.location && w.location.coordinates ? 'Calculated by client' : 'N/A', // fallback helper
      }));

    res.status(200).json({
      success: true,
      count: formattedWorkers.length,
      data: formattedWorkers,
    });
  } catch (error) {
    console.error('Get Nearby Workers Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving nearby workers',
    });
  }
};

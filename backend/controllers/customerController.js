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
    
    // Default radius is 50km (50000 meters) to encompass city/metro area
    const searchRadius = radius ? parseFloat(radius) : 50000; 

    // Build the query: online, available, not suspended
    const query = {
      isOnline: true,
      isAvailable: true,
      isSuspended: { $ne: true },
    };

    // If category is specified and is not "all", filter by category
    if (category && !['all', 'all services', 'emergency'].includes(category.toLowerCase().trim())) {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    // First try geospatial query within searchRadius
    let workers = [];
    try {
      workers = await WorkerProfile.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: searchRadius,
          },
        },
      }).populate({
        path: 'userId',
        select: 'name email phone profileImage address isActive',
      });
    } catch (geoErr) {
      console.warn('Geospatial $near query warning, falling back to general query:', geoErr.message);
    }

    // If no workers found with strict $near (or workers have uninitialized [0,0] coordinates),
    // fetch all online workers matching the query
    if (!workers || workers.length === 0) {
      workers = await WorkerProfile.find(query).populate({
        path: 'userId',
        select: 'name email phone profileImage address isActive',
      });
    }

    // Format the response and assign fallback nearby coordinates if coordinates are [0, 0]
    const formattedWorkers = workers
      .filter(w => w.userId && w.userId.isActive !== false)
      .map((w, index) => {
        let coords = w.location?.coordinates || [0, 0];
        
        // If coordinates are uninitialized [0, 0], place them slightly offset around the user coordinates
        if (coords[0] === 0 && coords[1] === 0) {
          const offsetLat = (index + 1) * 0.003 * (index % 2 === 0 ? 1 : -1);
          const offsetLng = (index + 1) * 0.003 * (index % 3 === 0 ? 1 : -1);
          coords = [lng + offsetLng, lat + offsetLat];
        }

        return {
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
          isVerified: w.isVerified,
          location: coords, // [longitude, latitude]
          distance: 'Nearby',
        };
      });

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

const WorkerProfile = require('../models/WorkerProfile');
const User = require('../models/User');

// @desc    Get current worker profile and status
// @route   GET /api/worker/profile
// @access  Private (Worker only)
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let workerProfile = await WorkerProfile.findOne({ userId: req.user.id });
    
    // If somehow profile is missing (e.g. registered before but failed to create profile), create a default one
    if (!workerProfile) {
      workerProfile = await WorkerProfile.create({
        userId: req.user.id,
        category: 'Plumber', // fallback default
        experience: 1,
      });
    }

    res.status(200).json({
      success: true,
      user,
      profile: workerProfile,
    });
  } catch (error) {
    console.error('Get Worker Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
};

// @desc    Update worker availability and online status
// @route   PUT /api/worker/status
// @access  Private (Worker only)
exports.updateStatus = async (req, res) => {
  try {
    const { isOnline, isAvailable, latitude, longitude } = req.body;
    
    let workerProfile = await WorkerProfile.findOne({ userId: req.user.id });
    if (!workerProfile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }

    if (isOnline || isAvailable) {
      if (workerProfile.isSuspended) {
        return res.status(403).json({
          success: false,
          message: 'Your account is currently suspended. Please contact support.',
        });
      }
    }

    if (isOnline !== undefined) workerProfile.isOnline = isOnline;
    if (isAvailable !== undefined) workerProfile.isAvailable = isAvailable;

    if (latitude !== undefined && longitude !== undefined) {
      workerProfile.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
      workerProfile.lastLocationUpdate = Date.now();
    }

    await workerProfile.save();

    // Broadcast status update in real-time to all connected customers
    const io = req.app.get('io');
    if (io) {
      io.emit('worker:statusUpdated', {
        workerId: req.user.id,
        isOnline: workerProfile.isOnline,
        isAvailable: workerProfile.isAvailable,
        category: workerProfile.category,
        location: workerProfile.location?.coordinates,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: workerProfile,
    });
  } catch (error) {
    console.error('Update Worker Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};

// @desc    Update worker live location coordinates
// @route   PUT /api/worker/location
// @access  Private (Worker only)
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both latitude and longitude',
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    let workerProfile = await WorkerProfile.findOne({ userId: req.user.id });
    if (!workerProfile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }

    workerProfile.location = {
      type: 'Point',
      coordinates: [lng, lat], // [longitude, latitude]
    };
    workerProfile.lastLocationUpdate = Date.now();

    await workerProfile.save();

    // Broadcast location update in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('worker:locationUpdated', {
        workerId: req.user.id,
        latitude: lat,
        longitude: lng,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      location: workerProfile.location,
    });
  } catch (error) {
    console.error('Update Worker Location Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating location' });
  }
};

// @desc    Update worker category and description details
// @route   PUT /api/worker/profile
// @access  Private (Worker only)
exports.updateProfile = async (req, res) => {
  try {
    const { category, experience, description } = req.body;

    let workerProfile = await WorkerProfile.findOne({ userId: req.user.id });
    if (!workerProfile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }

    if (category) workerProfile.category = category;
    if (experience !== undefined) workerProfile.experience = Number(experience);
    if (description !== undefined) workerProfile.description = description;

    await workerProfile.save();

    res.status(200).json({
      success: true,
      message: 'Profile details updated successfully',
      data: workerProfile,
    });
  } catch (error) {
    console.error('Update Worker Profile Details Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile details' });
  }
};

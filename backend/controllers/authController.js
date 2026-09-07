const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role, address, category, experience, description, idProof } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email or phone already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'customer',
      address,
    });

    // If role is worker, create worker profile
    if (user.role === 'worker') {
      if (!category || !experience) {
        // Rollback user creation if worker details are missing
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ success: false, message: 'Worker category and experience are required' });
      }
      
      await WorkerProfile.create({
        userId: user._id,
        category,
        experience,
        description,
        documents: { idProof }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token: generateToken(user._id, user.role),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage || '',
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: generateToken(user._id, user.role),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage || '',
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let profileData = { user };

    if (user.role === 'worker') {
      const workerProfile = await WorkerProfile.findOne({ userId: user._id });
      profileData.workerProfile = workerProfile;
    }

    res.status(200).json({ success: true, data: profileData });
  } catch (error) {
    console.error('Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

// @desc    Update user profile (Name, Phone, Profile Image, and Worker details)
// @route   PUT /api/auth/profile
// @access  Private (All authenticated roles)
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, profileImage, category, experience, description } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (phone) {
      const existingPhone = await User.findOne({ phone: phone.trim(), _id: { $ne: user._id } });
      if (existingPhone) {
        return res.status(400).json({ success: false, message: 'Phone number is already in use by another account' });
      }
      user.phone = phone.trim();
    }
    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    await user.save();

    let workerProfileData = null;
    if (user.role === 'worker') {
      let workerProfile = await WorkerProfile.findOne({ userId: user._id });
      if (workerProfile) {
        if (category) workerProfile.category = category;
        if (experience !== undefined && experience !== '') workerProfile.experience = Number(experience);
        if (description !== undefined) workerProfile.description = description;
        await workerProfile.save();
        workerProfileData = workerProfile;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage || '',
      },
      workerProfile: workerProfileData,
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

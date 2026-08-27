const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rapidfix';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    // Clean existing test data
    const emailsToClean = [
      'customer@test.com',
      'john@plumbing.com',
      'mike@electrician.com',
      'clara@carpenter.com',
      'admin@rapidfix.com'
    ];

    const usersToClean = await User.find({ email: { $in: emailsToClean } });
    const userIds = usersToClean.map(u => u._id);

    await User.deleteMany({ _id: { $in: userIds } });
    await WorkerProfile.deleteMany({ userId: { $in: userIds } });
    console.log('Cleared existing test users and profiles.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    const adminHashed = await bcrypt.hash('adminpassword', salt);

    // 1. Create Customer
    const customer = await User.create({
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '1234567890',
      password: hashedPassword,
      role: 'customer',
      address: {
        street: '123 Main St',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postalCode: '380001',
        country: 'India'
      }
    });
    console.log('Created customer:', customer.email);

    // 2. Create Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@rapidfix.com',
      phone: '5555555555',
      password: adminHashed,
      role: 'admin'
    });
    console.log('Created admin:', admin.email);

    // 3. Create Plumber Worker
    const plumberUser = await User.create({
      name: 'John Plumber',
      email: 'john@plumbing.com',
      phone: '9876543210',
      password: hashedPassword,
      role: 'worker',
      address: {
        street: '456 Flowing Water Ave',
        city: 'Ahmedabad',
        state: 'Gujarat'
      }
    });

    await WorkerProfile.create({
      userId: plumberUser._id,
      category: 'Plumber',
      experience: 6,
      description: 'Expert residential and commercial plumbing. Leak detection, pipe replacement, and clog clearing.',
      isOnline: true,
      isAvailable: true,
      isVerified: true,
      rating: 4.8,
      totalRatings: 12,
      completedJobs: 24,
      location: {
        type: 'Point',
        coordinates: [72.5764, 23.0275] // Very close to fallback [72.5714, 23.0225]
      }
    });
    console.log('Created plumber:', plumberUser.email);

    // 4. Create Electrician Worker
    const electricianUser = await User.create({
      name: 'Mike Electrician',
      email: 'mike@electrician.com',
      phone: '8765432109',
      password: hashedPassword,
      role: 'worker',
      address: {
        street: '789 Sparking Energy Rd',
        city: 'Ahmedabad',
        state: 'Gujarat'
      }
    });

    await WorkerProfile.create({
      userId: electricianUser._id,
      category: 'Electrician',
      experience: 4,
      description: 'Certified domestic wireman. Fan installation, circuit board repair, and short circuit troubleshooting.',
      isOnline: true,
      isAvailable: true,
      isVerified: true,
      rating: 4.5,
      totalRatings: 8,
      completedJobs: 15,
      location: {
        type: 'Point',
        coordinates: [72.5664, 23.0175] // Very close to fallback
      }
    });
    console.log('Created electrician:', electricianUser.email);

    // 5. Create Carpenter Worker
    const carpenterUser = await User.create({
      name: 'Clara Carpenter',
      email: 'clara@carpenter.com',
      phone: '7654321098',
      password: hashedPassword,
      role: 'worker',
      address: {
        street: '101 Wooden Bench Ln',
        city: 'Ahmedabad',
        state: 'Gujarat'
      }
    });

    await WorkerProfile.create({
      userId: carpenterUser._id,
      category: 'Carpenter',
      experience: 9,
      description: 'Furniture repair and custom woodwork. Wardrobe assembly, door repairs, and kitchen cabinet restoration.',
      isOnline: true,
      isAvailable: true,
      isVerified: true,
      rating: 4.9,
      totalRatings: 21,
      completedJobs: 40,
      location: {
        type: 'Point',
        coordinates: [72.5814, 23.0325] // Very close to fallback
      }
    });
    console.log('Created carpenter:', carpenterUser.email);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
  }
}, {
  timestamps: true
});

// Ensure a customer can only review a specific job once
reviewSchema.index({ jobId: 1, customerId: 1 }, { unique: true });
reviewSchema.index({ workerId: 1 });

module.exports = mongoose.model('Review', reviewSchema);

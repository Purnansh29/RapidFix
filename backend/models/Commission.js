const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobAmount: {
    type: Number,
    required: true,
  },
  commissionRate: {
    type: Number,
    default: 10, // 10%
  },
  commissionAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending',
  },
  upiReference: {
    type: String,
  },
  qrCode: {
    type: String,
  },
  paidAt: {
    type: Date,
  }
}, {
  timestamps: true
});

commissionSchema.index({ status: 1 });
commissionSchema.index({ workerId: 1 });

module.exports = mongoose.model('Commission', commissionSchema);

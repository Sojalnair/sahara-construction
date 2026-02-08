const mongoose = require('mongoose');

/**
 * Credential Model
 * Stores WebAuthn credentials for biometric authentication
 */

const credentialSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  userType: {
    type: String,
    required: true,
    enum: ['User', 'Employee']
  },
  credentialId: {
    type: Buffer,
    required: true,
    unique: true
  },
  publicKey: {
    type: Buffer,
    required: true
  },
  counter: {
    type: Number,
    required: true,
    default: 0
  },
  transports: [{
    type: String,
    enum: ['internal', 'usb', 'nfc', 'ble']
  }],
  aaguid: {
    type: Buffer
  },
  deviceInfo: {
    userAgent: String,
    platform: String,
    registeredAt: {
      type: Date,
      default: Date.now
    }
  },
  lastUsedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for fast lookups
credentialSchema.index({ userId: 1, userType: 1 });
credentialSchema.index({ credentialId: 1 });

module.exports = mongoose.model('Credential', credentialSchema);

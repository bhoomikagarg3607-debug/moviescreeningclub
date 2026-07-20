const mongoose = require('mongoose')

const QRSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  free: {
    type: Boolean,
    default: false
  },
  membership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership',
    required: function () {
      return !this.free
    }
  },
  showtime: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  txnId: {
    type: String,
    required: function () {
      return !this.free
    }
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  OTP: {
    type: String
  },
  used: {
    type: Boolean,
    default: false
  },
  isValid: {
    type: Boolean,
    default: true
  },
  name: {          // ✅ CUSTOM NAME FIELD
    type: String,
    required: true
  },        
  deleted: {
    type: Boolean,
    default: false
  },
  seat: {
    type: String,
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  expirationDate: {
    type: Date,
    default: new Date('2100-01-01T12:00:00Z')
  }
})

if (!mongoose.models.QR) {
  mongoose.model('QR', QRSchema)
}

module.exports = mongoose.models.QR

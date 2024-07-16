const Mongoose = require('mongoose');

const { MERCHANT_STATUS } = require('../constants');

const { Schema } = Mongoose;

// Merchant Schema
const MerchantSchema = new Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  brandName: {
    // місце проживання
    type: String
  },
  business: {
    // військова частина
    type: String
  },
  birthDate: {
    type: Date
  },
  citizenship: {
    type: String
  },
  relative: {
    type: String
  },
  photo: {
    type: String
  },
  docsName: {
    type: String
  },
  armyDepartment: {
    type: String
  },
  dateOfPrisoning: {
    type: Date
  },
  placeOfDissapear: {
    type: String
  },
  healthState: {
    type: String
  },
  position: {
    type: String
  },
  features: {
    type: String
  },
  details: {
    type: String
  },
  photoUrl: { type: String },
  isActive: {
    type: Boolean,
    default: false
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
    default: null
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  idCodePow: {
    type: String
  },
  status: {
    type: String,
    default: MERCHANT_STATUS.Waiting_Approval,
    enum: [
      MERCHANT_STATUS.Waiting_Approval,
      MERCHANT_STATUS.Rejected,
      MERCHANT_STATUS.Approved
    ]
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Merchant', MerchantSchema);

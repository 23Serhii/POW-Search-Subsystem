const Mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const { Schema } = Mongoose;

const options = {
  separator: '-',
  lang: 'en',
  truncate: 120
};

Mongoose.plugin(slug, options);

// Product Schema
const ProductSchema = new Schema({
  sku: {
    // ступінь спорідненості
    type: String
  },
  name: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    slug: 'name',
    unique: true
  },
  imageUrl: {
    type: String
  },
  imageKey: {
    type: String
  },
  phoneNumberPow: {
    type: String
  },
  cityLivePow: {
    type: String
  },
  milPartPow: {
    type: String
  },
  birthDatePow: {
    type: Date
  },
  citizenshipPow: {
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
  idCodePow: {
    type: String
  },
  description: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  },
  taxable: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
    default: null
  },
  phoneNumberPow: {
    type: String
  },
  cityLivePow: {
    type: String
  },
  milPartPow: {
    type: String
  },
  birthDatePow: {
    type: Date
  },

  citizenshipPow: {
    type: String
  },

  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Product', ProductSchema);

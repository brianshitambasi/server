const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    shortDesc: { type: String, default: '' },
    longDesc: { type: String, default: '' },
    category: { type: String, default: 'General' },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'KES' },
    images: { type: [imageSchema], default: [] },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

productSchema.pre('validate', function () {
  if (this.name && !this.slug) {
    this.slug =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') +
      '-' +
      Date.now().toString(36);
  }
});

module.exports = mongoose.model('Product', productSchema);

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, default: '' },
    content: { type: String, required: true },
    coverImage: { type: String, default: '' },
    isPublished: { type: Boolean, default: true },
    author: { type: String, default: 'CEO TNT' }
  },
  { timestamps: true }
);

postSchema.pre('validate', function () {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36);
  }
});

module.exports = mongoose.model('Post', postSchema);

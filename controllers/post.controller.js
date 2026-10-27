const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// PUBLIC
exports.listPublic = asyncHandler(async (req, res) => {
  const items = await Post.find({ isPublished: true }).sort({ createdAt: -1 }).select('-content');
  res.json({ success: true, items });
});

exports.getPublic = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug, isPublished: true });
  if (!post) throw ApiError.notFound('Post not found');
  res.json({ success: true, post });
});

// ADMIN
exports.listAdmin = asyncHandler(async (req, res) => {
  const items = await Post.find({}).sort({ createdAt: -1 });
  res.json({ success: true, items });
});

exports.create = asyncHandler(async (req, res) => {
  const { title, excerpt, content, coverImage, isPublished } = req.body;
  const post = await Post.create({ title, excerpt, content, coverImage, isPublished });
  res.status(201).json({ success: true, post });
});

exports.update = asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!post) throw ApiError.notFound('Post not found');
  res.json({ success: true, post });
});

exports.remove = asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndDelete(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');
  res.json({ success: true, message: 'Post deleted' });
});

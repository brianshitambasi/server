const Review = require('../models/Review');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// PUBLIC — list approved reviews for a product
exports.listPublic = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) throw ApiError.notFound('Product not found');

  const reviews = await Review.find({
    product: product._id,
    status: 'APPROVED'
  }).sort({ createdAt: -1 }).select('-email');

  const avg =
    reviews.length === 0
      ? 0
      : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  res.json({
    success: true,
    reviews,
    average: Math.round(avg * 10) / 10,
    count: reviews.length
  });
});

// PUBLIC — submit a review (goes to PENDING, must be approved by admin)
exports.submit = asyncHandler(async (req, res) => {
  const { name, email, rating, text } = req.body;
  const product = await Product.findById(req.params.productId);
  if (!product) throw ApiError.notFound('Product not found');

  const existing = await Review.findOne({
    product: product._id,
    email: email.toLowerCase()
  });
  if (existing) throw ApiError.conflict('You already reviewed this product.');

  const review = await Review.create({
    product: product._id,
    name,
    email,
    rating,
    text,
    status: 'PENDING'
  });

  res.status(201).json({
    success: true,
    message: 'Thank you — your review is pending approval.',
    review: { id: review._id, status: review.status }
  });
});

// ADMIN — list all (any status)
exports.listAdmin = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const items = await Review.find(filter)
    .populate('product', 'name')
    .sort({ createdAt: -1 })
    .limit(500);

  res.json({ success: true, items });
});

// ADMIN — update status (approve/reject)
exports.updateAdmin = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
    throw ApiError.badRequest('Invalid status');
  }
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate('product', 'name');
  if (!review) throw ApiError.notFound('Review not found');
  res.json({ success: true, review });
});

// ADMIN — delete
exports.deleteAdmin = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  res.json({ success: true });
});

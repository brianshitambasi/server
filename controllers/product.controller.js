const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// PUBLIC — read only
exports.listPublic = asyncHandler(async (req, res) => {
  const items = await Product.find({ isActive: true }).sort({ createdAt: -1 });
  res.json({ success: true, items });
});

exports.getPublic = asyncHandler(async (req, res) => {
  const item = await Product.findById(req.params.id);
  if (!item || !item.isActive) throw ApiError.notFound('Product not found');
  res.json({ success: true, item });
});

// ADMIN — CEO only
exports.createProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body, createdBy: req.user.id, updatedBy: req.user.id };
  const product = await Product.create(payload);
  res.status(201).json({ success: true, product });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user.id },
    { new: true }
  );
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ success: true, product });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ success: true, message: 'Product deleted' });
});

// ADMIN — list all products (including inactive)
exports.listAdmin = asyncHandler(async (req, res) => {
  const items = await Product.find({}).sort({ createdAt: -1 });
  res.json({ success: true, items });
});

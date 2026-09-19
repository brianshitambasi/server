const cloudinary = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto' }]
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

exports.uploadProductImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw ApiError.badRequest('No files received. Use field name "images".');
  }

  const folder = 'yobbytech/products';
  const results = await Promise.all(
    req.files.map((f) => uploadBuffer(f.buffer, folder))
  );

  const images = results.map((r) => ({
    url: r.secure_url,
    publicId: r.public_id,
    width: r.width,
    height: r.height
  }));

  res.status(201).json({ success: true, images });
});

exports.deleteProductImage = asyncHandler(async (req, res) => {
  const publicId = req.params.publicId;
  if (!publicId) throw ApiError.badRequest('publicId required');

  const result = await cloudinary.uploader.destroy(publicId);
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw ApiError.badRequest(`Cloudinary delete failed: ${result.result}`);
  }
  res.json({ success: true, result: result.result });
});

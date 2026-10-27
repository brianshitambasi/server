const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

const adminProspect = require('../controllers/admin.prospect.controller');
const productController = require('../controllers/product.controller');
const dashboardController = require('../controllers/dashboard.controller');
const analyticsController = require('../controllers/analytics.controller');
const uploadController = require('../controllers/upload.controller');
const reviewController = require('../controllers/review.controller');
const leadController = require('../controllers/lead.controller');
const postController = require('../controllers/post.controller');

router.use(auth, requireRole('ceo'));

// Dashboard
router.get('/dashboard/stats', dashboardController.stats);
router.get('/dashboard/recent', dashboardController.recentProspects);
router.get('/dashboard/due-today', dashboardController.dueToday);
router.get('/dashboard/upcoming', dashboardController.upcoming);
router.get('/dashboard/followups-grouped', dashboardController.grouped);

// Prospects
router.get('/prospects', adminProspect.listProspects);
router.post('/prospects', adminProspect.createProspect);
router.get('/prospects/:id', adminProspect.getProspect);
router.patch('/prospects/:id', adminProspect.updateProspect);
router.delete('/prospects/:id', adminProspect.deleteProspect);
router.post('/prospects/:id/logs', adminProspect.addLog);
router.post('/prospects/:id/followups', adminProspect.createFollowUp);

// Follow-ups
router.patch('/followups/:id', adminProspect.completeFollowUp);
router.patch('/followups/:id/snooze', dashboardController.snoozeFollowUp);

// Products
router.get('/products', productController.listAdmin);
router.post('/products', productController.createProduct);
router.patch('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

// Uploads
router.post('/uploads/product', upload.array('images', 6), uploadController.uploadProductImages);
router.delete('/uploads/product/*publicId', uploadController.deleteProductImage);

// Analytics
router.get('/analytics/sources', analyticsController.sources);
router.get('/analytics/overview', analyticsController.overview);
router.get('/analytics/referrals', analyticsController.referrals);

// Leads (Free Guide)
router.get('/leads', leadController.listAdmin);

// Blog
router.get('/posts', postController.listAdmin);
router.post('/posts', postController.create);
router.patch('/posts/:id', postController.update);
router.delete('/posts/:id', postController.remove);

// Reviews
router.get('/reviews', reviewController.listAdmin);
router.patch('/reviews/:id', reviewController.updateAdmin);
router.delete('/reviews/:id', reviewController.deleteAdmin);

module.exports = router;

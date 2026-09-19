const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const publicRoutes = require('./public.routes');
const adminRoutes = require('./admin.routes');

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/', publicRoutes);
router.use('/admin', adminRoutes);

module.exports = router;

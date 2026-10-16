const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    brand: 'BRIAN — CEO TNT',
    team: 'TNT',
    role: 'CEO TNT',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

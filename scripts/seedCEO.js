// Force Node.js to use public DNS for SRV lookups (Windows c-ares fix)
require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  try {
    await connectDB();

    const email = (process.env.CEO_EMAIL || '').toLowerCase();
    if (!email) {
      console.error('[seed] CEO_EMAIL missing in .env');
      process.exit(1);
    }

    let user = await User.findOne({ email });
    const passwordHash = await User.hashPassword(process.env.CEO_PASSWORD || 'ChangeMe123!');

    if (user) {
      user.name = process.env.CEO_NAME || user.name;
      user.passwordHash = passwordHash;
      user.role = 'ceo';
      await user.save();
      console.log(`[seed] CEO updated: ${email}`);
    } else {
      user = await User.create({
        name: process.env.CEO_NAME || 'CEO TNT',
        email,
        passwordHash,
        role: 'ceo'
      });
      console.log(`[seed] CEO created: ${email}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[seed] error:', err.message);
    process.exit(1);
  }
})();

// pages/api/login.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../../models/User';
import Driver from '../../models/Driver';

// Database connection function
const connectDB = async () => {
 if (mongoose.connections[0].readyState) return;

 // Connect to MongoDB using environment variable and database name
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: 'Ryda',
  });
};

// API handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Connect to MongoDB
    await connectDB();

    const { email, password, accountType } = req.body;

    // Check required fields
    if (!email || !password || !accountType) {
      return res
        .status(400)
        .json({ message: 'Missing email, password, or account type' });
    }

    // Choose the correct model based on accountType
    const Model = accountType === 'driver' ? Driver : User;

    // Fetch user by email (include password for comparison)
    // The .select('+password') is CRUCIAL for bcrypt.compare to work.
    const user = await Model.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Account not found' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Login successful
    return res.status(200).json({
      message: 'Login successful',
      userId: user._id.toString(),
      accountType,
    });

  } catch (err) {
    console.error('Login error:', err);
    return res
      .status(500)
      .json({ message: 'Something went wrong. Please try again.' });
  }
}
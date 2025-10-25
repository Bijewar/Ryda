// pages/api/reset-password.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../../models/User';
import Driver from '../../models/Driver';

// Database connection function (Essential for every API file)
const connectDB = async () => {
    if (mongoose.connections[0].readyState) return;
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'Ryda' });
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await connectDB();

        const { token, accountType, newPassword } = req.body;

        // 1. Basic validation
        if (!token || !newPassword || !accountType) {
            return res.status(400).json({ message: 'Missing token, password, or account type' });
        }
        
        // Ensure password meets minimum length requirement (optional, but good practice)
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
        }


        const Model = accountType === 'driver' ? Driver : User;

        // 2. Fetch user by token ONLY (No time check in the query to avoid clock drift issues)
        const user = await Model.findOne({ resetToken: token });

        if (!user) {
            console.error(`Token check failed: No user found for token.`);
            return res.status(400).json({ message: 'Password reset link is invalid or has expired. Please request a new one.' });
        }
        
        // 3. Manual Expiration and Integrity Check
        const currentTime = Date.now();

        // Check if the expiry field exists (Robustness check)
        if (!user.resetTokenExpiry) {
             user.resetToken = undefined; 
             await user.save();
             console.error(`Token found, but expiry date is missing/null for user: ${user.email}`);
             return res.status(400).json({ message: 'Password reset link is invalid or has expired. Please request a new one.' });
        }

        const expiryTime = user.resetTokenExpiry.getTime(); 
        
        // If the expiry time is LESS than the current time, the token is expired.
        if (expiryTime < currentTime) {
             // Invalidate token fields manually to prevent future attempts
             user.resetToken = undefined;
             user.resetTokenExpiry = undefined;
             await user.save();
             console.error(`Token EXPIRED for user: ${user.email}. Expiry: ${new Date(expiryTime)} Current: ${new Date(currentTime)}`);
             return res.status(400).json({ message: 'Password reset link has expired. Please request a new one.' });
        }

        // 4. Hash the new password and update record
        const hashedPassword = await bcrypt.hash(newPassword, 12); // Use 12 salt rounds

        user.password = hashedPassword;
        user.resetToken = undefined; // Invalidate the token
        user.resetTokenExpiry = undefined; // Clear the expiry
        await user.save();

        return res.status(200).json({ message: 'Password reset successful! You can now log in with your new password.' });

    } catch (err) {
        // Log the detailed error to the server console
        console.error('Password Reset Error (500):', err);
        return res.status(500).json({ message: 'Failed to reset password. An internal error occurred.' });
    }
}
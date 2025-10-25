// pages/api/forgot-password.js

import mongoose from 'mongoose';
import crypto from 'crypto';
import nodemailer from 'nodemailer'; 
import User from '../../models/User';
import Driver from '../../models/Driver';

// Database connection function (Essential for every API file)
const connectDB = async () => {
 if (mongoose.connections[0].readyState) return;
 await mongoose.connect(process.env.MONGODB_URI, {
    dbName: 'Ryda',
 });
};

// 🛑 Nodemailer Transporter Setup (Using 'service: "gmail"' which previously worked) 🛑
const transporter = nodemailer.createTransport({
    service: 'gmail', // This automatically configures host/port for Gmail
    auth: {
        user: process.env.EMAIL_USER, // Sender email from .env.local
        pass: process.env.EMAIL_PASS, // App password from .env.local
    },
});

// API handler
export default async function handler(req, res) {
 if (req.method !== 'POST') {
   return res.status(405).json({ message: 'Method not allowed' });
 }

 try {
   await connectDB();

   const { email, accountType } = req.body;

   if (!email || !accountType) {
     return res
       .status(400)
       .json({ message: 'Missing email or account type' });
   }

   // Choose the correct model
   const Model = accountType === 'driver' ? Driver : User;

   // 1. Find the user by email
   const user = await Model.findOne({ email });

   // SECURITY: Always return a generic success message if the user is not found.
   if (!user) {
        console.log(`Password reset requested for non-existent account: ${email}`);
     return res.status(200).json({
       message:
         'If an account with that email exists, a password reset link has been sent.',
     });
   }

   // 2. Generate a secure, unique token
   const resetToken = crypto.randomBytes(32).toString('hex');
   // Set token expiry to 1 hour (3600000 milliseconds)
   const resetTokenExpiry = Date.now() + 3600000; 

   // 3. Save the token and expiry to the user's document
   user.resetToken = resetToken;
   user.resetTokenExpiry = resetTokenExpiry;
   await user.save(); // 🛑 This is the critical save operation 🛑
    
    // Debug Log: Check the token being saved to ensure consistency
    console.log('DEBUG: TOKEN SAVED TO DB:', resetToken); 

   // Determine the base URL for the reset link
   const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-production-url.com' 
        : 'http://localhost:3000';
    
   // 4. Construct the full reset link
   const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&type=${accountType}`;

   // 🛑 EMAIL SENDING IMPLEMENTATION 🛑
    try {
        await transporter.sendMail({
            to: user.email,
            from: process.env.EMAIL_USER, 
            subject: 'Ryda Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #333;">Password Reset for Ryda Account</h2>
                    <p>Hello,</p>
                    <p>You recently requested to reset the password for your ${accountType} account (${user.email}).</p>
                    <p>Please click the button below to complete the reset process:</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; margin-top: 15px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Reset My Password
                    </a>
                    <p style="margin-top: 20px; font-size: 0.9em; color: #777;">
                        This link will expire in 1 hour.
                    </p>
                    <p style="font-size: 0.8em; color: #aaa;">Link: ${resetUrl}</p>
                </div>
            `,
        });
        console.log(`Password reset email successfully sent to: ${user.email}`);

    } catch (mailError) {
        // Log the error but continue to return 200 to the client for security
        console.error('NODEMAILER FAILED TO SEND EMAIL:', mailError);
    }
   
   // 5. Respond to the client
   return res.status(200).json({
     message:
       'Password reset link sent! Check your email.',
   });
 } catch (err) {
   console.error('Forgot password process error:', err);
   return res
     .status(500)
     .json({ message: 'Something went wrong. Please try again.' });
 }
}
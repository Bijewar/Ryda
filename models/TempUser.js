// models/TempUser.js
import mongoose from 'mongoose';

const TempUserSchema = new mongoose.Schema({
  // Basic User Data
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true }, // Hashed password
  accountType: { type: String, enum: ['user', 'driver'], required: true },

  // Driver Data (Conditional)
  driverLicense: { type: String },
  vehicleModel: { type: String },
  licensePlate: { type: String },
  address: { type: String },
  licenseFront: { type: String }, // Temporary file path or public URL
  licenseBack: { type: String },  // Temporary file path or public URL

  // OTP Data
  otp: { type: String, required: true }, // Hashed OTP
  otpExpires: { type: Date, required: true },
  
  // Timestamp for automatic cleanup (MongoDB TTL Index)
  createdAt: { type: Date, default: Date.now, index: { expires: '15m' } } // Expires after 15 minutes
});

// Set up the TTL index if it doesn't exist
// This ensures MongoDB automatically cleans up expired records.
// TempUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 }); // 900 seconds = 15 minutes

const TempUser = mongoose.models.TempUser || mongoose.model('TempUser', TempUserSchema);
export default TempUser;
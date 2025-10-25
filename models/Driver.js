import mongoose from "mongoose";

const DriverSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      index: true 
    },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    accountType: { 
      type: String, 
      enum: ["driver"], 
      default: "driver" 
    },
    driverLicense: { type: String, required: true },
    vehicleModel: { type: String, required: true },
    licensePlate: { type: String, required: true },
    address: { type: String, required: true },
    licenseFront: { type: String, required: true },
    licenseBack: { type: String, required: true },
    isApproved: { 
      type: Boolean, 
      default: false,
      index: true 
    },
    isActive: { 
      type: Boolean, 
      default: true,
      index: true 
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    // 🛑 START: Forgot Password Fields 🛑
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    // 🛑 END: Forgot Password Fields 🛑
  },
  { 
    timestamps: true,
    collection: 'drivers',
    toJSON: { virtuals: true }
  }
);

// Keep this compound index
DriverSchema.index({ createdAt: -1 });

DriverSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

DriverSchema.pre('save', function(next) {
  if (this.isModified('isApproved')) {
    const now = new Date();
    if (this.isApproved) {
      this.approvedAt = now;
      this.rejectedAt = undefined;
      this.rejectionReason = undefined;
    } else if (this.isApproved === false && this.rejectionReason) {
      this.rejectedAt = now;
      this.approvedAt = undefined;
    }
  }
  next();
});

export default mongoose.models.Driver || mongoose.model("Driver", DriverSchema);
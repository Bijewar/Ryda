import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      index: true 
    },
    password: { type: String },
    provider: { type: String, default: "credentials" },
    profilePic: { type: String },
    accountType: { 
      type: String, 
      enum: ["user", "driver"], 
      default: "user",
      index: true 
    },
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },
    driverLicense: { 
      type: String, 
      required: function() { return this.accountType === "driver" } 
    },
    vehicleModel: { 
      type: String, 
      required: function() { return this.accountType === "driver" } 
    },
    licensePlate: { 
      type: String, 
      required: function() { return this.accountType === "driver" } 
    },
    address: { 
      type: String, 
      required: function() { return this.accountType === "driver" } 
    },
    licenseFront: { type: String },
    licenseBack: { type: String },
    isApproved: { 
      type: Boolean, 
      default: function() { return this.accountType === "user" ? true : false },
      index: true 
    },
    isActive: { type: Boolean, default: true },
    // 🛑 START: Forgot Password Fields 🛑
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    // 🛑 END: Forgot Password Fields 🛑
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true }
  }
);

UserSchema.virtual('fullName').get(function() {
  return this.firstName && this.lastName 
    ? `${this.firstName} ${this.lastName}`
    : this.name;
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
// pages/api/users.js
import dbConnect from "../../lib/mongodb"; // update the path based on your folder structure
import mongoose from "mongoose";

// Optional: define a user model if not defined elsewhere
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    await dbConnect(); // ✅ connect using your custom logic

    const users = await User.find({});
    return res.status(200).json(users);
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

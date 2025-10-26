// pages/api/drivers/[id].js
import mongoose from 'mongoose';
import Driver from '../../../models/Driver';

// NOTE: In a real app, use a dedicated dbConnect function from a lib folder
// MongoDB connection utility (kept here for self-containment)
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'Ryda',
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error', err);
  }
};

export default async function handler(req, res) {
  await connectDB();

  const { id } = req.query;

  if (req.method === 'GET') {
    // ------------------------------------
    // Existing GET logic (View Driver Details)
    // ------------------------------------
    try {
      // Handle special case for "dashboard" - this should not happen in production
      // but for now, we'll return a placeholder or redirect
      if (id === 'dashboard') {
        return res.status(400).json({ message: 'Invalid driver ID: dashboard' });
      }

      const driver = await Driver.findById(id);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      res.status(200).json({ driver });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during GET' });
    }
  } else if (req.method === 'PUT') {
    // ------------------------------------
    // New PUT logic (Admin Status Updates)
    // ------------------------------------
    const { action } = req.body;
    let update = {};

    try {
      if (!action) {
        return res.status(400).json({ message: 'Missing action in request body' });
      }

      switch (action) {
        case 'approve':
          update = { isApproved: true };
          break;
        case 'reject':
          update = { isApproved: false };
          break;
        case 'activate':
          update = { isActive: true };
          break;
        case 'deactivate':
          update = { isActive: false };
          break;
        default:
          return res.status(400).json({ message: 'Invalid action provided' });
      }

      const updatedDriver = await Driver.findByIdAndUpdate(
        id, 
        { $set: update }, 
        { new: true } // Return the updated document
      );

      if (!updatedDriver) {
        return res.status(404).json({ message: 'Driver not found for update' });
      }

      res.status(200).json({ 
        message: `Driver status updated: ${action}`, 
        driver: updatedDriver 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during PUT update' });
    }
  } else {
    // ------------------------------------
    // Method Not Allowed
    // ------------------------------------
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
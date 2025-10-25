// pages/api/drivers/index.js
import mongoose from 'mongoose';
import Driver from '../../../models/Driver';

// MongoDB connection utility
const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    console.log('✅ Already connected to MongoDB');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'Ryda',
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err; // Throw error to be caught by handler
  }
};

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      // ------------------------------------
      // GET all drivers
      // ------------------------------------
      try {
        const drivers = await Driver.find({}).sort({ createdAt: -1 }).lean();
        
        console.log(`✅ Fetched ${drivers.length} drivers from database`);
        
        return res.status(200).json({ 
          success: true,
          drivers: drivers,
          count: drivers.length 
        });
      } catch (error) {
        console.error('❌ Error fetching drivers:', error);
        return res.status(500).json({ 
          success: false,
          message: 'Failed to fetch drivers from database',
          error: error.message 
        });
      }
    } else if (req.method === 'POST') {
      // ------------------------------------
      // POST - Create a new driver (optional)
      // ------------------------------------
      try {
        const newDriver = await Driver.create(req.body);
        console.log('✅ New driver created:', newDriver._id);
        
        return res.status(201).json({ 
          success: true,
          message: 'Driver created successfully',
          driver: newDriver 
        });
      } catch (error) {
        console.error('❌ Error creating driver:', error);
        return res.status(500).json({ 
          success: false,
          message: 'Failed to create driver',
          error: error.message 
        });
      }
    } else {
      // ------------------------------------
      // Method Not Allowed
      // ------------------------------------
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ 
        success: false,
        message: `Method ${req.method} Not Allowed` 
      });
    }
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Database connection failed',
      error: error.message 
    });
  }
}
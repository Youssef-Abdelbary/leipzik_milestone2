// 1. Configure environment variables (Must be first)
require('dotenv').config(); 

// 2. Import dependencies
const mongoose = require('mongoose');

// 3. Define and execute connection logic
const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB!");

    // Debug: Safely list collections to verify access
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("📂 Available collections:", collections.map(c => c.name));

  } catch (err) {
    console.error("❌ Database connection error:", err);
    process.exit(1); // Exit the process with failure if DB connection fails
  }
};

connectToDatabase();
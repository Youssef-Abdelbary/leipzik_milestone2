const express = require("express");
const cors = require("cors");
const app = express();
const User = require("./models/User");
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.passwordHash !== password) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error during login",
    });
  }
});
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
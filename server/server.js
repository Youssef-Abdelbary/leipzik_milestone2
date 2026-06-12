import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import registerRoute from "./routes/routeRegister.js";
import registerOthersRoute from "./routes/routeRegisterOthers.js";
import deactivateRoutes from "./routes/routeDeactivate.js";
import guestsRoutes from "./routes/routeGuests.js";


import User from "./models/User.js";

const app = express();

// Middleware
app.use(
  cors({
    exposedHeaders: ["x-new-token"],
  })
);
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Routes from teammates
app.use("/api/auth", registerRoute);
app.use("/api/users", registerOthersRoute);
app.use("/api/deactivate", deactivateRoutes);
app.use("/api/guests", guestsRoutes);

// Login route
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

// Connect to DB then start server
const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!");

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(
      "Available collections:",
      collections.map((c) => c.name)
    );

    const PORT = process.env.PORT || 5001;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
};

connectToDatabase();
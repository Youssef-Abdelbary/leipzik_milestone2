import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import registerRoute from "./routes/routeRegister.js";
import registerOthersRoute from "./routes/routeRegisterOthers.js";
import deactivateRoutes from "./routes/routeDeactivate.js";

const app = express();

// Middleware
app.use(cors({
  exposedHeaders: ["x-new-token"],
}));
app.use(express.json());

// Routes
app.use("/api/auth", registerRoute);
app.use("/api/users", registerOthersRoute);
app.use("/api/deactivate", deactivateRoutes);

// Connect to DB then start server
const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!");

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Available collections:", collections.map(c => c.name));

    app.listen(5001, () => console.log("Server running on port 5001"));

  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
};

connectToDatabase();
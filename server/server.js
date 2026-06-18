import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import registerRoute from "./routes/routeRegister.js";
import registerOthersRoute from "./routes/routeRegisterOthers.js";
import deactivateRoutes from "./routes/routeDeactivate.js";
import guestsRoutes from "./routes/routeGuests.js";
import venueRoutes from "./routes/routeVenue.js";
import browseVenueRoutes from "./routes/routeBrowseVenue.js";
import routeResponseVenue from './routes/routeResponseVenue.js';
import routeMangeBookings from './routes/routeManageBookings.js'
import eventRoutes from "./routes/routeEvent.js";
import guestRoutes from "./routes/routeGuest.js";
import EventLayout from "./models/EventLayout.js";
import layoutRoutes from "./routes/layoutRoutes.js";
import notificationRoute from "./routes/routeNotification.js";
import browseVendorRoutes from "./routes/routeBrowseVendor.js";
import workflowRoutes from "./routes/routeWorkFlow.js";
import budgetRoutes from "./routes/routeBudget.js";
import routeReplyVenue from './routes/routeReplyVenue.js';
import broadcastReadRoute from './routes/routeBroadcastRead.js';
import feedbackRoutes from './routes/routeFeedback.js';
import loginRoute from "./routes/routeLogin.js";
import VendorTrackingRoutes from './routes/routeVendorTracking.js';
import teamRoutes from "./routes/routeTeam.js";
import staffTasksRoutes from "./routes/routeStaffTasks.js";
import userRoutes from "./routes/routeProfile.js";
import { setServers } from "node:dns/promises";
import invoiceRoutes from "./routes/routeInvoices.js";
import staffDayOfRoutes from "./routes/routeStaffDayOf.js";
import eventReportRoutes from "./routes/routeEventReport.js";

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
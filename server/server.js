import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import registerRoute from "./routes/routeRegister.js";
import registerOthersRoute from "./routes/routeRegisterOthers.js";
import deactivateRoutes from "./routes/routeDeactivate.js";
import guestsRoutes from "./routes/routeGuests.js";
import User from "./models/User.js";
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
import broadcastReadRoute from './routes/routeBroadcastRead.js';
import feedbackRoutes from './routes/routeFeedback.js';
import loginRoute from "./routes/routeLogin.js";
import VendorTrackingRoutes from './routes/routeVendorTracking.js';
import teamRoutes from "./routes/routeTeam.js";

import { setServers } from "node:dns/promises";
import invoiceRoutes from "./routes/routeInvoices.js";

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
app.use("/api/venues", venueRoutes);
app.use("/api/browseVenues", browseVenueRoutes);
app.use("/api/guests", guestsRoutes);
app.use('/api/venueResponse', routeResponseVenue);
app.use('/api/bookings', routeMangeBookings);
app.use("/api/events", eventRoutes);
app.use("/api", guestRoutes);
app.use("/api/notifications", notificationRoute);
app.use("/api/venues", venueRoutes);
app.use("/api/browseVenues", browseVenueRoutes);
app.use("/api/browseVendors", browseVendorRoutes);
app.use("/api/browseVendors/request", browseVendorRoutes);
app.use("/api/workflow", workflowRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/layouts", layoutRoutes);
app.use('/api/broadcasts', broadcastReadRoute);
app.use('/api/feedback', feedbackRoutes);
app.use("/api/auth", loginRoute);
app.use('/api/vendorRequests', VendorTrackingRoutes);
app.use("/api/workflow", workflowRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/layouts", layoutRoutes);
// Login route
app.use("/api/team", teamRoutes);



// Connect to DB then start server
const connectToDatabase = async () => {
  try {
    setServers(["1.1.1.1", "8.8.8.8"]);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!");

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Available collections:", collections.map((c) => c.name));

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
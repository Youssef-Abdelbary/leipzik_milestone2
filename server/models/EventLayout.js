import mongoose from "mongoose";

const layoutElementSchema = new mongoose.Schema(
  {
    elementId: String,
    type: String,
    label: String,
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    rotation: {
      type: Number,
      default: 0,
    },
    style: {
      type: Object,
      default: {},
    },
  },
  { _id: false }
);

const eventLayoutSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },

    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    title: {
      type: String,
      default: "Venue Layout",
    },

    version: {
      type: Number,
      default: 1,
    },

    canvasSize: {
      width: Number,
      height: Number,
    },

    elements: [layoutElementSchema],

    sharedWithStaff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    exportFiles: [
      {
        fileType: String,
        url: String,
        createdAt: Date,
      },
    ],
  },
  {
    timestamps: true,
    collection: "event_layouts",
  }
);

const EventLayout =
  mongoose.models.EventLayout ||
  mongoose.model("EventLayout", eventLayoutSchema);

export default EventLayout;
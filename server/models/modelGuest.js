import mongoose from 'mongoose';

const guestSchema = new mongoose.Schema({
    eventId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Event', 
        required: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null 
    },
    fullName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    email: { 
        type: String, 
        required: true, 
        lowercase: true, 
        trim: true 
    },
    phone: { 
        type: String, 
        required: true 
    },
    invitationStatus: { 
        type: String, 
        enum: ['sent', 'opened', 'delivered', 'failed'], 
        default: 'opened' 
    },
    rsvp: {
        status: { 
            type: String, 
            enum: ['pending', 'attending', 'declined'], 
            default: 'pending' 
        },
        respondedAt: { 
            type: Date 
        },
        dietaryPreferences: [{ 
            type: String 
        }],
        specialRequirements: { 
            type: String, 
            default: "" 
        }
    },
    qrCode: {
        code: { 
            type: String, 
            unique: true, 
            sparse: true // Allows multiple null/missing QR codes without unique collisions
        },
        generatedAt: { 
            type: Date 
        }
    },
    checkIn: {
        status: { 
            type: String, 
            enum: ['Hasn\'t Arrived', 'Arrived'], 
            default: 'Hasn\'t Arrived' 
        },
        checkedInAt: { 
            type: Date 
        },
        checkedInBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            default: null 
        },
        method: { 
            type: String, 
            enum: ['qr', 'manual'], 
            default: 'manual' 
        }
    },
    invitationSentAt: { 
        type: Date 
    },
    confirmationSentAt: { 
        type: Date 
    }
}, 
    { timestamps: true,collection: 'event_guests' } // This automatically creates and manages your "createdAt" and "updatedAt" fields
);

export default mongoose.models.Guest || mongoose.model('Guest', guestSchema);
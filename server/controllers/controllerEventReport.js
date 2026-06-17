import mongoose from 'mongoose';
import Event from '../models/modelEvent.js';
import Guest from '../models/modelGuest.js';
import Feedback from '../models/modelFeedback.js';

export const getEventReport = async (req, res) => {
    try {
        const { eventId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID.' });
        }

        const eventObjectId = new mongoose.Types.ObjectId(eventId);

        const event = await Event.findById(eventObjectId).lean();

        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        // Access check — organizer only
        if (event.organizerId?.toString() !== req.user?.user_id?.toString()) {
            return res.status(403).json({ message: 'Access denied. Organizer only.' });
        }

        const expensesCollection = mongoose.connection.db.collection('expense_records');

        const [expenses, guests, feedbacks] = await Promise.all([
            expensesCollection.find({ eventId: eventObjectId }).toArray(),
            Guest.find({ eventId: eventObjectId }).lean(),
            Feedback.find({ eventId: eventObjectId, submittedAt: { $ne: null } }).lean(),
        ]);

        // ── Budget ──────────────────────────────────────────────────────────
        const plannedTotal = Number(event.budget?.plannedTotal || 0);
        const actualTotal = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const plannedBreakdown = event.budget?.plannedBreakdown || [];

        const categoryComparison = plannedBreakdown.map(item => {
            const actual = expenses
                .filter(e => e.category === item.category)
                .reduce((sum, e) => sum + Number(e.amount || 0), 0);
            return {
                category: item.category,
                planned: Number(item.plannedAmount || 0),
                actual,
                difference: Number(item.plannedAmount || 0) - actual,
            };
        });

        // ── Attendance ──────────────────────────────────────────────────────
        const totalGuests = guests.length;
        const attendingGuests = guests.filter(g => g.rsvp?.status === 'attending').length;
        const checkedIn = guests.filter(g => g.checkIn?.status === 'Arrived').length;
        const rsvpPending = guests.filter(g => g.rsvp?.status === 'pending').length;
        const rsvpDeclined = guests.filter(g => g.rsvp?.status === 'declined').length;
        const checkInRate = attendingGuests > 0 ? Math.round((checkedIn / attendingGuests) * 100) : 0;

        // ── Feedback ────────────────────────────────────────────────────────
        let feedbackAverages = null;
        let feedbackDistribution = null;
        const CATS = ['experience', 'food', 'venue', 'organisation'];

        if (feedbacks.length > 0) {
            feedbackAverages = {};
            CATS.forEach(cat => {
                const vals = feedbacks.map(f => f[cat]).filter(v => v != null);
                feedbackAverages[cat] = vals.length
                    ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
                    : null;
            });
            const allVals = Object.values(feedbackAverages).filter(v => v != null);
            feedbackAverages.overall = allVals.length
                ? Math.round((allVals.reduce((a, b) => a + b, 0) / allVals.length) * 10) / 10
                : null;

            feedbackDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            feedbacks.forEach(f => {
                if (f.experience >= 1 && f.experience <= 5) feedbackDistribution[f.experience]++;
            });
        }

        const responseRate = attendingGuests > 0
            ? Math.round((feedbacks.length / attendingGuests) * 100)
            : 0;

        res.json({
            eventId,
            eventTitle: event.title,
            eventDate: event.date,
            eventStatus: event.status,
            currency: event.budget?.currency || 'EGP',
            budget: {
                plannedTotal,
                actualTotal,
                difference: plannedTotal - actualTotal,
                plannedBreakdown,
                actualExpenses: expenses,
                categoryComparison,
            },
            attendance: {
                totalGuests,
                attendingGuests,
                checkedIn,
                rsvpPending,
                rsvpDeclined,
                checkInRate,
            },
            feedback: {
                count: feedbacks.length,
                responseRate,
                averages: feedbackAverages,
                distribution: feedbackDistribution,
            },
        });
    } catch (err) {
        console.error('getEventReport error:', err);
        res.status(500).json({ message: 'Failed to generate event report.', error: err.message });
    }
};

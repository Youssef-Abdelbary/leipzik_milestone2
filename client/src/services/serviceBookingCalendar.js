import { apiFetch } from "../utils/apiFetch";

// Helper to turn a filters object into a query string, skipping empty values
function buildQuery(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, value);
        }
    });
    const query = params.toString();
    return query ? `?${query}` : "";
}

// Page 1: confirmed bookings for the calendar (supports venueId, status, startDate, endDate)
export const getConfirmedBookings = async (filters = {}) => {
    const query = buildQuery(filters);
    return apiFetch(`/bookings/confirmed${query}`);
};
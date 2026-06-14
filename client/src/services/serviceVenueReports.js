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

// Page 2 (top): summary dashboard — totals, revenue, occupancy rate per venue
export const getBookingSummary = async (filters = {}) => {
    const query = buildQuery(filters);
    return apiFetch(`/bookings/summary${query}`);
};

// Page 2 (bottom): historical booking data for the export table
export const getBookingHistory = async (filters = {}) => {
    const query = buildQuery(filters);
    return apiFetch(`/bookings/history${query}`);
};
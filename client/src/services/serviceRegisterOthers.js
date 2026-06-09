import { apiFetch } from "../utils/apiFetch";

export const registerForOthers = async (userData) => {
    return await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(userData),
    });
};
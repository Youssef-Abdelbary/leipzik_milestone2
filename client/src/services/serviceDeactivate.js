import { apiFetch } from "../utils/apiFetch";

export async function fetchUsers(search = "") {
  const params = new URLSearchParams();
  const trimmedSearch = search.trim();

  if (trimmedSearch) {
    params.set("search", trimmedSearch);
  }

  const queryString = params.toString();

  return apiFetch(queryString ? `/deactivate?${queryString}` : "/deactivate");
}

export async function toggleUserStatus(id) {
  return apiFetch(`/deactivate/${id}`, {
    method: "PUT",
  });
}
import { apiFetch } from "../utils/apiFetch";

export async function fetchWorkflowSummary(organizerId) {
  return apiFetch(`/workflow/summary/${organizerId}`);
}

export async function fetchWorkflowEvents(organizerId) {
  return apiFetch(`/workflow/events/${organizerId}`);
}

export async function fetchWorkflowTasks(organizerId) {
  return apiFetch(`/workflow/tasks/${organizerId}`);
}

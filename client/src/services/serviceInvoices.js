import { apiFetch } from "../utils/apiFetch";

export async function fetchInvoices(id) {
  return apiFetch(`/invoices/${id}`);
}

export async function createInvoice(payload) {
  return apiFetch("/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function reviewInvoice(id, status) {
  return apiFetch(`/invoices/${id}/review`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// File uploads can't go through apiFetch because it forces
// "Content-Type: application/json" — the browser needs to set its own
// multipart boundary for FormData, so we call fetch directly here.
export async function uploadSupportingDocument(id, file) {
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("token");

  const res = await fetch(`http://localhost:5001/api/invoices/${id}/documents`, {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Upload failed");
  }

  return data;
}
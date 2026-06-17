import { apiFetch, BASE_URL, getUserIdFromToken } from "../utils/apiFetch";

export { getUserIdFromToken };

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

export async function uploadSupportingDocument(id, file) {
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/invoices/${id}/documents`, {
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